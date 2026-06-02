from flask import Flask, request, jsonify
from flask_cors import CORS
from PyPDF2 import PdfReader

import re
import pickle
import numpy as np
import pandas as pd
import json
from groq import Groq

# ------------------ APP SETUP ------------------
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "OPTIONS"], "allow_headers": ["Content-Type", "Authorization"]}})

# ------------------ GROQ SETUP ------------------
import os
groq_key = os.environ.get("GROQ_API_KEY", "")
# Fallback to local testing mock or empty string if not set
groq_client = Groq(api_key=groq_key)


# ------------------ LOAD MODELS ------------------
import os
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "model")

salary_model = pickle.load(open(os.path.join(MODEL_DIR, "salary_model.pkl"), "rb"))
tfidf        = pickle.load(open(os.path.join(MODEL_DIR, "tfidf.pkl"), "rb"))
mlb          = pickle.load(open(os.path.join(MODEL_DIR, "mlb.pkl"), "rb"))
columns      = pickle.load(open(os.path.join(MODEL_DIR, "columns.pkl"), "rb"))

# ------------------ FIREBASE ADMIN SETUP ------------------
import firebase_admin
from firebase_admin import credentials, auth

firebase_initialized = False

# 1. Try to load service account from environment variable as JSON string
firebase_env = os.environ.get("FIREBASE_SERVICE_ACCOUNT")
if firebase_env:
    try:
        cred_dict = json.loads(firebase_env)
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
        firebase_initialized = True
        print("Firebase Admin SDK initialized successfully via environment variable.")
    except Exception as e:
        print("Failed to initialize Firebase from env var:", repr(e))

# 2. If not initialized, try loading from local serviceAccountKey.json
if not firebase_initialized:
    local_key_path = os.path.join(BASE_DIR, "serviceAccountKey.json")
    if os.path.exists(local_key_path):
        try:
            cred = credentials.Certificate(local_key_path)
            firebase_admin.initialize_app(cred)
            firebase_initialized = True
            print("Firebase Admin SDK initialized successfully via local serviceAccountKey.json.")
        except Exception as e:
            print("Failed to initialize Firebase from local key file:", repr(e))

# 3. Fallback / Mock mode for local testing if no keys are provided yet
if not firebase_initialized:
    try:
        # Initialize with default credentials (useful for GCP environments)
        firebase_admin.initialize_app()
        firebase_initialized = True
        print("Firebase Admin SDK initialized successfully via default credentials.")
    except Exception as e:
        print("----------------------------------------------------------------------------------")
        print("WARNING: Firebase credentials not found.")
        print("Backend will run in DEVELOPMENT MOCK AUTH MODE.")
        print("To fully secure the backend, set the FIREBASE_SERVICE_ACCOUNT environment variable")
        print("or add serviceAccountKey.json to your backend folder.")
        print("----------------------------------------------------------------------------------")


# ------------------ HELPERS ------------------

def extract_pdf(file):
    reader = PdfReader(file)
    text = ""
    for page in reader.pages:
        t = page.extract_text()
        if t:
            text += t
    return text


def clean_text(text):
    text = text.lower()
    text = re.sub(r'[^a-zA-Z0-9 ]', ' ', text)
    return re.sub(r'\s+', ' ', text).strip()


# -------------------------------------------------------
# PIPELINE 1 — ML MODEL: Salary Prediction Only
# -------------------------------------------------------

def predict_salary(jd_text, experience_level="Mid-level", country="United States", years_of_experience=4.0, ats_score=75):
    """Uses the salary model to estimate market salary for this role."""
    try:
        skills = [s for s in mlb.classes_ if s in jd_text]
        skills_vec = mlb.transform([skills])

        text_vec = tfidf.transform([jd_text]).toarray()
            
        # Validate country
        valid_countries = ["Australia", "Canada", "Germany", "United Kingdom", "United States"]
        if country not in valid_countries:
            country = "United States"

        data_dict = {
            "experience_level": experience_level,
            "country":          country,
            "remote_type":      "remote"
        }
        
        # Add MLB skills dynamically
        for i, col in enumerate(mlb.classes_):
            data_dict[col] = skills_vec[0][i]
            
        # Add TF-IDF features dynamically
        for i, col in enumerate(tfidf.get_feature_names_out()):
            data_dict[f"tfidf_{col}"] = text_vec[0][i]

        structured = pd.DataFrame([data_dict])
        structured = pd.get_dummies(structured)

        # Reindex to exactly match the 137 columns the RandomForestRegressor expects
        structured = structured.reindex(columns=columns, fill_value=0)

        base_salary = int(salary_model.predict(structured.values)[0])
        
        # Non-linear scaling multiplier depending on exact numeric years of experience (reduces fresher values realistically)
        if years_of_experience < 1.0:
            # 0 years starts at 45% (absolute fresher), scaling to 70% at 1 year
            exp_multiplier = 0.45 + (years_of_experience * 0.25)
        elif years_of_experience < 3.0:
            # 1 year starts at 70%, scaling to 90% at 3 years
            exp_multiplier = 0.70 + ((years_of_experience - 1.0) * 0.10)
        else:
            # For 3+ years, calculate standard relative adjustments
            brackets = {
                "Junior": 2.0,
                "Mid-level": 4.0,
                "Senior": 8.0,
                "Lead": 12.0,
                "Management": 16.0
            }
            base_years = brackets.get(experience_level, 4.0)
            diff = years_of_experience - base_years
            
            # Category-specific adjustments
            if experience_level == "Junior":
                adjustment = 0.90 + (diff * 0.05)
            elif experience_level == "Mid-level":
                adjustment = 1.0 + (diff * 0.05)
            elif experience_level == "Senior":
                adjustment = 1.0 + (diff * 0.04)
            elif experience_level == "Lead":
                adjustment = 1.0 + (diff * 0.03)
            else:
                adjustment = 1.0 + (diff * 0.02)
                
            exp_multiplier = max(0.8, min(1.4, adjustment))
            
        # ATS Resume Quality Multiplier: ranges from 0.80 (score=0) to 1.15 (score=100)
        ats_modifier = 0.80 + (ats_score / 100.0) * 0.35
        ats_modifier = max(0.80, min(1.15, ats_modifier))
        
        # Combine base model value, experience curve, and resume quality factors
        final_salary = int(base_salary * exp_multiplier * ats_modifier)
        return final_salary
    except Exception as e:
        print("ML MODEL ERROR:", repr(e))
        return 95000  # median fallback if model fails


# -------------------------------------------------------
# PIPELINE 2 — AI (GROQ): ATS Score & Qualitative Insights
# -------------------------------------------------------

def get_ai_insights(resume_text, jd_text):
    """
    Uses LLaMA 3 on Groq as the primary ATS engine.
    It generates the ATS match score based on deep semantic understanding
    of the career objective, experience, skills, and framing.
    """
    prompt = f"""
You are an expert ATS (Applicant Tracking System) and senior technical recruiter.

First, determine if:
1. The uploaded Resume text actually represents a professional resume, CV, or professional profile. If the document is completely random, unrelated (e.g. a recipe, essay, book chapter, instruction manual, blank text), or cannot be analyzed as a person's professional profile, mark "is_resume" as false.
2. The Job Description (JD) text actually represents a valid, professional job description or role specification. If the job description is completely random, garbage text (e.g. keyboard mashing 'asdfasdf', single unrelated words, conversational noise, cooking recipes), or cannot be analyzed as a professional role, mark "is_jd" as false.

Return ONLY valid JSON, no markdown, no conversational text. Exactly match this structure:

{{
  "is_resume": <boolean, true if it is a valid resume/CV/professional profile, false otherwise>,
  "rejection_reason": "If is_resume is false, provide a professional, friendly, and specific explanation of why the document was rejected. Keep empty if is_resume is true.",
  "is_jd": <boolean, true if the Job Description represents a valid, meaningful job description or role specification, false otherwise>,
  "jd_rejection_reason": "If is_jd is false, provide a professional, friendly, and specific explanation of why the Job Description was rejected. Keep empty if is_jd is true.",
  "ats_score": <integer 0-100 representing the total fit>,
  "experience_level": "entry, mid, senior, or executive based strictly on years of experience in the resume",
  "career_objective": {{
    "alignment": "How well does the candidate's stated objective/summary align with this role?",
    "recommendation": "Exactly how should they rewrite their objective/summary?"
  }},
  "experience": {{
    "relevance": "Which parts of their experience are most relevant and why? Which are weak or missing?",
    "framing": "How should they reframe or reorder their experience to better match this JD?"
  }},
  "strengths": ["List 3-5 genuine strengths visible from the resume for THIS specific role. Keep empty if is_resume or is_jd is false."],
  "gaps": ["List 3-5 specific gaps — missing experience, tools, certifications, or soft skills. Keep empty if is_resume or is_jd is false."],
  "action_items": ["List 4-6 specific, actionable improvements. Keep empty if is_resume or is_jd is false."],
  "overall_assessment": "A 2-3 sentence honest professional summary of the candidate's fit, or a brief note explaining the invalid input if is_resume or is_jd is false."
}}

Resume:
{resume_text}

Job Description:
{jd_text}
"""

    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that strictly outputs JSON only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama-3.3-70b-versatile",
            temperature=0,
            response_format={"type": "json_object"}
        )
        
        raw = chat_completion.choices[0].message.content.strip()
        raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        return json.loads(raw)

    except Exception as e:
        print("GROQ ERROR:", repr(e))
        return {
            "is_resume": True,
            "rejection_reason": "",
            "is_jd": True,
            "jd_rejection_reason": "",
            "ats_score": 0,
            "experience_level": "mid",
            "career_objective": {
                "alignment": f"API error occurred.",
                "recommendation": "N/A"
            },
            "experience": {
                "relevance": "N/A",
                "framing": "N/A"
            },
            "strengths": [],
            "gaps": [],
            "action_items": [f"Error details: {repr(e)}"],
            "overall_assessment": "Analysis failed."
        }


# ------------------ MAIN ROUTE ------------------

@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        # Firebase Token Authentication Check
        if firebase_initialized:
            auth_header = request.headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                return jsonify({"error": "Unauthorized: Missing or malformed authentication token."}), 401
            
            id_token = auth_header.split("Bearer ")[1]
            try:
                decoded_token = auth.verify_id_token(id_token)
                user_email = decoded_token.get("email", "unknown")
                print(f"Authenticated request from user: {user_email}")
            except Exception as e:
                print("Firebase Token Verification Error:", repr(e))
                return jsonify({"error": "Unauthorized: Invalid or expired authentication token."}), 401
        else:
            auth_header = request.headers.get("Authorization")
            if not auth_header:
                print("Mock Auth Warning: Request received without Authorization header.")

        resume_file = request.files["resume"]
        jd          = request.form["jd"]
        country     = request.form.get("country", "United States")
        
        # User Manual Experience Input
        exp_val     = float(request.form.get("exp_value", 0))
        exp_unit    = request.form.get("exp_unit", "Years")

        # Convert everything to years
        if exp_unit == "Months":
            years_of_experience = exp_val / 12.0
        else:
            years_of_experience = exp_val

        # Map to the new ML categorical columns exactly
        if years_of_experience <= 2.5:
            ml_exp_level = "Junior"
        elif years_of_experience <= 5.5:
            ml_exp_level = "Mid-level"
        elif years_of_experience <= 10.0:
            ml_exp_level = "Senior"
        elif years_of_experience <= 15.0:
            ml_exp_level = "Lead"
        else:
            ml_exp_level = "Management"

        # Extract & clean
        resume_text  = extract_pdf(resume_file)
        resume_clean = clean_text(resume_text)
        jd_clean     = clean_text(jd)

        # Heuristic pre-checks (protects against blank/unreadable/tiny files and empty job descriptions)
        if not resume_clean or len(resume_clean) < 100:
            return jsonify({"error": "The uploaded PDF appears to be empty, scanned without readable text, or contains too little content. Please upload a valid text-based PDF resume."}), 400
        
        if not jd_clean or len(jd_clean) < 30:
            return jsonify({"error": "The job description is too short or empty. Please provide a valid professional job description."}), 400

        # Pipeline 2: Groq AI — ATS Score & rich qualitative insights
        insights = get_ai_insights(resume_clean, jd_clean)
        
        # Validate if the document is recognized as a resume
        if not insights.get("is_resume", True):
            rejection_reason = insights.get("rejection_reason", "The uploaded document does not appear to be a valid professional resume/CV. Please upload a valid resume.")
            return jsonify({"error": rejection_reason}), 400

        # Validate if the job description is recognized as a professional spec
        if not insights.get("is_jd", True):
            jd_rejection = insights.get("jd_rejection_reason", "The job description does not appear to be a valid professional spec. Please paste a valid job specification.")
            return jsonify({"error": jd_rejection}), 400
        
        ats_score = insights.pop("ats_score", 0)
        
        # We no longer use the AI's experience level for ML since the user provides it directly.
        insights.pop("experience_level", None)
        insights.pop("is_resume", None)
        insights.pop("rejection_reason", None)
        insights.pop("is_jd", None)
        insights.pop("jd_rejection_reason", None)

        # Pipeline 1: ML model — Salary prediction (now using user's explicit input, exact numeric years, and ATS score)
        salary = predict_salary(jd_clean, experience_level=ml_exp_level, country=country, years_of_experience=years_of_experience, ats_score=ats_score)

        return jsonify({
            "ats_score": ats_score,
            "salary":    salary,
            "insights":  insights
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ------------------ RUN ------------------

if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=5000)