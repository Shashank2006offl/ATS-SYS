import os
import pickle
import pandas as pd
import numpy as np

# Load ML Models
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "model")

salary_model = pickle.load(open(os.path.join(MODEL_DIR, "salary_model.pkl"), "rb"))
tfidf        = pickle.load(open(os.path.join(MODEL_DIR, "tfidf.pkl"), "rb"))
mlb          = pickle.load(open(os.path.join(MODEL_DIR, "mlb.pkl"), "rb"))
columns      = pickle.load(open(os.path.join(MODEL_DIR, "columns.pkl"), "rb"))

def predict_salary(jd_text, experience_level="Mid-level", country="United States"):
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

        return int(salary_model.predict(structured.values)[0])
    except Exception as e:
        print("ML MODEL ERROR:", repr(e))
        return 95000  # median fallback if model fails
