import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
groq_key = os.environ.get("GROQ_API_KEY", "")
groq_client = Groq(api_key=groq_key)

def get_ai_insights(resume_text, jd_text):
    """
    Uses LLaMA 3 on Groq as the primary ATS engine.
    It generates the ATS match score based on deep semantic understanding
    of the career objective, experience, skills, and framing.
    """
    
    def is_gibberish(text):
        if not text or len(text.strip()) < 30:
            return True
        words = text.split()
        if not words: return True
        avg_len = sum(len(w) for w in words) / len(words)
        if avg_len > 15:
            return True
        return False
        
    if is_gibberish(resume_text) or is_gibberish(jd_text):
        return {
            "ats_score": 0,
            "experience_level": "entry",
            "career_objective": {
                "alignment": "Invalid input detected.",
                "recommendation": "Please provide a valid, legible resume and job description."
            },
            "experience": {
                "relevance": "N/A",
                "framing": "N/A"
            },
            "strengths": [],
            "gaps": ["The provided text appears to be random characters or gibberish. Cannot analyze."],
            "action_items": ["Upload a real resume.", "Paste a real job description."],
            "overall_assessment": "Analysis aborted due to invalid or nonsensical input."
        }

    prompt = f"""
You are a highly critical, expert ATS (Applicant Tracking System) and strict senior technical recruiter.

Analyze the candidate's resume against the Job Description.

CRITICAL SCORING RULES:
1. BE RUTHLESS. If the resume is completely unrelated to the job description, or if either text contains random nonsensical words, the `ats_score` MUST be between 0 and 15.
2. Do not give out high scores out of politeness. Only give scores above 75 to candidates who genuinely meet almost all core requirements.
3. Heavily penalize missing mandatory skills or experience.

Return ONLY valid JSON, no markdown, no conversational text. Exactly match this structure:

{{
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
  "strengths": ["List 3-5 genuine strengths visible from the resume for THIS specific role"],
  "gaps": ["List 3-5 specific gaps — missing experience, tools, certifications, or soft skills"],
  "action_items": ["List 4-6 specific, actionable improvements"],
  "overall_assessment": "A 2-3 sentence honest professional summary of the candidate's fit."
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
