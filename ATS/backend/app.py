import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS

from dotenv import load_dotenv

# Import our new refactored services and utilities
from services.ml_service import predict_salary
from services.ai_service import get_ai_insights
from utils.text_utils import extract_pdf, clean_text

# ------------------ APP SETUP ------------------
load_dotenv()
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "OPTIONS"], "allow_headers": ["Content-Type", "Authorization"]}})

# ------------------ FIREBASE ADMIN SETUP ------------------
import firebase_admin
from firebase_admin import credentials

firebase_initialized = False
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

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
            print("Failed to initialize Firebase locally:", repr(e))


# ------------------ MAIN ROUTE ------------------
@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        resume_file = request.files["resume"]
        jd          = request.form["jd"]
        country     = request.form.get("country", "United States")
        role        = request.form.get("role", "Machine Learning")
        
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

        # Pipeline 2: Groq AI — ATS Score & rich qualitative insights
        insights = get_ai_insights(resume_clean, jd_clean)
        
        ats_score = insights.pop("ats_score", 0)
        
        # We no longer use the AI's experience level for ML since the user provides it directly.
        insights.pop("experience_level", None)

        # Pipeline 1: ML model — Base Market Salary prediction
        if role == "Machine Learning":
            base_salary = predict_salary(jd_clean, experience_level=ml_exp_level, country=country)
            
            # Artificially adjust the ML prediction to scale heavily with experience
            if ml_exp_level == "Junior":
                salary = int(base_salary * 0.5)
            elif ml_exp_level == "Mid-level":
                salary = int(base_salary * 0.75)
            elif ml_exp_level == "Senior":
                salary = int(base_salary * 1.0)
            elif ml_exp_level == "Lead":
                salary = int(base_salary * 1.25)
            else:
                salary = int(base_salary * 1.5)
        else:
            salary = None

        return jsonify({
            "ats_score": ats_score,
            "salary":    salary,
            "insights":  insights
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ------------------ RUN ------------------
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)