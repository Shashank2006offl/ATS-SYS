<div align="center">

# 🧠 Fitfolio.ai

### *Resume Intelligence Platform*

**ML-powered ATS scoring · AI qualitative coaching · Salary prediction — in one unified pipeline.**

[![React](https://img.shields.io/badge/React-Vite-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=flat-square&logo=python)](https://python.org/)
[![Flask](https://img.shields.io/badge/Flask-API-000000?style=flat-square&logo=flask)](https://flask.palletsprojects.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-ML-F7931E?style=flat-square&logo=scikit-learn)](https://scikit-learn.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

**If Fitfolio.ai saves you time or lands you an interview, consider giving it a ⭐ — it helps others find the project!**

</div>

---

## 📖 What is Fitfolio.ai?

Fitfolio.ai bridges the gap between candidates and the hiring systems that evaluate them. Most resumes are rejected by Applicant Tracking Systems before a human ever reads them — Fitfolio.ai tells you exactly why, and precisely how to fix it.

Upload your PDF resume, paste a job description, and get back:

- A concrete **ATS match score** with keyword-level breakdowns
- A **predicted salary range** calibrated to your target role and location
- **AI-generated coaching** covering strengths, gaps, and actionable rewrites

All wrapped in a polished dark-mode interface with glassmorphism aesthetics and zero fluff.

---

## ✨ Features

### 📄 Smart Resume Parsing
Drop in your PDF resume and a job description. Fitfolio.ai extracts structured data from both and runs them through the analysis pipeline instantly — no manual form-filling.

### 📊 ATS Match Scoring
Get a concrete percentage score measuring how well your resume aligns with the role. Understand which keywords and competencies are landing — and which are missing entirely.

### 💰 Salary Prediction
A `RandomForestRegressor` model trained on real Data Science job market data predicts market salary ranges based on the JD's required skills, seniority signals, and your specified geography.

### 🤖 AI-Powered Qualitative Coaching
The AI coaching layer goes beyond keywords to give you human-level feedback:

| Insight Type | What You Get |
|---|---|
| **Career Objective Alignment** | Rewrites and suggestions to tailor your summary to the specific role |
| **Experience Framing** | How to reframe past roles to speak the hiring team's language |
| **Strengths Identified** | The concrete skills and signals that will resonate with this JD |
| **Gap Analysis** | Honest, specific callouts of what's missing — before a recruiter finds it first |
| **Action Items** | Prioritized, concrete next steps to improve your resume before you apply |

### 🔐 Hybrid Authentication
Fitfolio.ai uses a layered security model that offers both convenience and security. Users register via Google Sign-In but are required to create a custom username and password, giving them two secure login paths for the same account. See [Authentication Flow](#-authentication-flow) for full details.

---

## 🛠️ Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | [React](https://react.dev/) via [Vite](https://vitejs.dev/) |
| Styling | Vanilla CSS — CSS Variables, Glassmorphism, Micro-animations |
| Icons | [Lucide React](https://lucide.dev/) |
| Auth Client | [Firebase Authentication](https://firebase.google.com/docs/auth) (Google OAuth + linked credentials) |

### Backend
| Layer | Technology |
|---|---|
| API Framework | [Python](https://www.python.org/) / [Flask](https://flask.palletsprojects.com/) |
| ML Model | `scikit-learn` — `RandomForestRegressor` for salary prediction and JD feature extraction |
| AI / NLP | Generative AI (Anthropic / OpenAI) for qualitative resume coaching |
| Auth Middleware | Firebase Admin SDK — Bearer Token verification on all protected routes |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v16 or higher
- **Python** 3.9 or higher
- A **Firebase Project** with Google Authentication enabled ([create one here](https://console.firebase.google.com/))

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/fitfolio.git
cd fitfolio
```

---

### 2. Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:

```env
FIREBASE_CREDENTIALS_PATH=path/to/your/serviceAccountKey.json
ANTHROPIC_API_KEY=your_key_here       # or OPENAI_API_KEY, depending on your setup
FLASK_ENV=development
```

Start the Flask development server:

```bash
python app.py
# API running at http://localhost:5000
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_URL=http://localhost:5000
```

Start the Vite development server:

```bash
npm run dev
# App running at http://localhost:5173
```

---

## 🔒 Authentication Flow

Fitfolio.ai implements a hybrid authentication model designed for both security and usability.

```
User Visits App
      │
      ▼
 Google Sign-In ──► New User? ──► Username + Password Setup
                                         │
                          linkWithCredential() to Firebase
                                         │
                    Two Login Paths Now Available:
                    ┌────────────┬──────────────────┐
                    │ Google SSO │ Username/Password │
                    └────────────┴──────────────────┘
                                 │
                    Firebase ID Token (JWT)
                                 │
                    Backend verifies via Admin SDK
                                 │
                    Protected API Routes Unlocked
```

1. All new users must initiate registration via **Google Sign-In**
2. New accounts are intercepted and required to set a **custom username and password**
3. Credentials are linked to the Google profile via Firebase's `linkWithCredential`
4. Users can subsequently authenticate via **either** Google OAuth or their custom username/password
5. All API routes are protected with **Bearer Token authentication**, verified server-side by the Firebase Admin SDK

---

## 📁 Project Structure

```
fitfolio/
├── frontend/                  # React + Vite client
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── pages/             # Route-level views
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API and Firebase service layer
│   │   └── styles/            # Global CSS variables and base styles
│   └── vite.config.js
│
├── backend/                   # Flask API
│   ├── app.py                 # Entry point and route definitions
│   ├── ml/
│   │   ├── salary_model.py    # RandomForestRegressor training and inference
│   │   └── feature_extractor.py  # JD keyword and skill extraction
│   ├── ai/
│   │   └── coach.py           # Generative AI coaching prompt pipeline
│   ├── auth/
│   │   └── middleware.py      # Firebase Admin SDK token verification
│   └── requirements.txt
│
└── README.md
```

---

## 🗺️ Roadmap

- [ ] Support for additional job categories beyond Data Science
- [ ] Resume version history and side-by-side comparison
- [ ] Browser extension for one-click analysis from job boards
- [ ] Exportable PDF report of coaching feedback
- [ ] Collaborative mode for career coaches and clients

---

## 🤝 Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change, then submit a pull request against the `main` branch.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to your fork: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## ⭐ Support the Project

If you found Fitfolio.ai useful, please consider starring the repository — it takes one second and makes a real difference in helping others discover the project.

[![Star on GitHub](https://img.shields.io/github/stars/your-username/fitfolio?style=social)](https://github.com/your-username/fitfolio)

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for details.

---

<div align="center">

Built with 🧠 by the Fitfolio.ai team

</div>