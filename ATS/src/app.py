from flask import Flask, request, jsonify
from flask_cors import CORS
from PyPDF2 import PdfReader
import re
import pickle
import numpy as np
import pandas as pd
# pyrefly: ignore [missing-import]
import google.generativeai as genai
import json

# ------------------ APP SETUP ------------------
app = Flask(__name__)
CORS(app)

# ------------------ GEMINI SETUP ------------------
genai.configure(api_key="AIzaSyDGUPkOnNPRfOuZbcwTSLHAcXpWtW-XPCs")
gemini_model = genai.GenerativeModel("gemini-pro")

# ------------------ LOAD MODELS ------------------
import os
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "backend", "model")

model = pickle.load(open(os.path.join(MODEL_DIR, "salary_model.pkl"), "rb"))
tfidf = pickle.load(open(os.path.join(MODEL_DIR, "tfidf.pkl"), "rb"))
mlb = pickle.load(open(os.path.join(MODEL_DIR, "mlb.pkl"), "rb"))
columns = pickle.load(open(os.path.join(MODEL_DIR, "columns.pkl"), "rb"))

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
    return text


def prepare_features(jd_text):
    jd_text = jd_text.lower()

    # ---- Skills ----
    skills = [s for s in mlb.classes_ if s in jd_text]
    skills_vec = mlb.transform([skills])

    # ---- Text (TF-IDF) ----
    text_vec = tfidf.transform([jd_text]).toarray()

    # ---- Structured (basic placeholder) ----
    structured = pd.DataFrame({
        "experience_level": ["mid"],
        "country": ["US"],
        "remote_type": ["remote"]
    })

    structured = pd.get_dummies(structured)
    structured = structured.reindex(columns=columns, fill_value=0)

    # ---- Combine ----
    final_input = np.hstack([
        structured.values,
        skills_vec,
        text_vec
    ])

    return final_input


def call_gemini(resume_text, jd):
    prompt = f"""
    Act as an ATS system.

    Compare the resume and job description.

    Return ONLY JSON (no explanation):

    {{
      "score": number,
      "matched_skills": [],
      "missing_skills": [],
      "suggestions": ""
    }}

    Resume:
    {resume_text}

    Job Description:
    {jd}
    """

    response = gemini_model.generate_content(prompt)
    
    try:
        # Try parsing JSON
        data = json.loads(response.text)
    except:
        # fallback if Gemini messes format
        data = {
            "score": 0,
            "matched_skills": [],
            "missing_skills": [],
            "suggestions": "Parsing failed"
        }

    return data


# ------------------ MAIN ROUTE ------------------

@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        resume_file = request.files["resume"]
        jd = request.form["jd"]

        # ---- Extract resume ----
        resume_text = extract_pdf(resume_file)

        # ---- Clean ----
        resume_clean = clean_text(resume_text)
        jd_clean = clean_text(jd)

        # ---- Gemini ATS ----
        ats_result = call_gemini(resume_clean, jd_clean)

        # ---- Salary prediction ----
        features = prepare_features(jd_clean)
        salary = model.predict(features)[0]

        return jsonify({
            "score": ats_result["score"],
            "matched": ats_result["matched_skills"],
            "missing": ats_result["missing_skills"],
            "suggestions": ats_result["suggestions"],
            "salary": int(salary)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ------------------ RUN ------------------

if __name__ == "__main__":
    app.run(debug=True)