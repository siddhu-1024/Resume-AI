import os
import json
import requests
from backend.app.config import Config
from backend.app.models.system import Setting

def get_ai_config():
    api_provider = Setting.get_val('ai_provider', Config.AI_PROVIDER)
    gemini_key = Setting.get_val('gemini_api_key', Config.GEMINI_API_KEY)
    openai_key = Setting.get_val('openai_api_key', Config.OPENAI_API_KEY)
    return api_provider, gemini_key, openai_key

def generate_ai_candidate_insights(candidate, job, screening_result=None):
    """
    Generates grounded AI insights:
    - Executive Candidate Summary
    - Strengths & Potential Growth Areas
    - Tailored Technical Interview Questions
    - Role Suitability Narrative
    
    Falls back gracefully to local deterministic synthesis if API keys are absent or requests fail.
    """
    api_provider, gemini_key, openai_key = get_ai_config()
    
    # 1. Fallback / Deterministic synthesis generator
    def build_deterministic_insights():
        skills_str = ", ".join([s.name for s in candidate.skills[:8]]) or "Various technical skills"
        matched = screening_result.get_matched() if screening_result else []
        missing = screening_result.get_missing() if screening_result else []
        
        summary = (
            f"{candidate.full_name} is a software professional with approximately {candidate.total_experience_years:.1f} "
            f"years of documented experience and an academic background in {candidate.highest_education}. "
            f"Key skill proficiencies detected include {skills_str}."
        )
        
        strengths = []
        if matched:
            strengths.append(f"Strong overlap with core required technologies: {', '.join(matched[:4])}.")
        if candidate.total_experience_years >= job.min_experience_years and job.min_experience_years > 0:
            strengths.append(f"Meets seniority target with {candidate.total_experience_years:.1f} years of relevant experience.")
        if candidate.projects:
            strengths.append(f"Demonstrated practical implementation across {len(candidate.projects)} distinct projects.")
            
        growth_areas = []
        if missing:
            growth_areas.append(f"No direct mention of {', '.join(missing[:3])} in resume.")
        if job.min_experience_years > 0 and candidate.total_experience_years < job.min_experience_years:
            growth_areas.append(f"Experience duration ({candidate.total_experience_years:.1f} yrs) is under the target {job.min_experience_years:.1f} yrs.")
        if not growth_areas:
            growth_areas.append("Ensure in-depth understanding of production architecture & system design.")
            
        questions = [
            f"How have you applied {matched[0] if matched else 'your core technical stack'} in high-concurrency production environments?",
            f"In your recent experience at {candidate.experiences[0].company_name if candidate.experiences else 'your prior role'}, what was your most impactful engineering contribution?",
            f"If selected, how would you approach ramping up on {(missing[0] if missing else 'new organizational tooling')}?",
            f"Can you explain your approach to automated testing, CI/CD, and code quality in agile teams?"
        ]
        
        return {
            'executive_summary': summary,
            'strengths': strengths,
            'growth_areas': growth_areas,
            'interview_questions': questions,
            'grounded_source': 'Deterministic Local NLP Engine'
        }
        
    # If Gemini API Key is configured
    if api_provider == 'gemini' and gemini_key:
        try:
            prompt = f"""You are an expert technical recruiter analyzing a candidate against a job specification.
Ground all statements strictly in the provided resume and job text. Do not hallucinate or make assumptions about personal characteristics.

JOB TITLE: {job.title}
JOB REQUIREMENTS: {job.raw_description}

CANDIDATE: {candidate.full_name}
EXPERIENCE: {candidate.total_experience_years} years
EDUCATION: {candidate.highest_education}
SKILLS DETECTED: {[s.name for s in candidate.skills]}
WORK HISTORY: {[e.job_title + ' at ' + e.company_name for e in candidate.experiences]}
PROJECTS: {[p.title for p in candidate.projects]}

Return ONLY a valid JSON object with keys:
"executive_summary" (string),
"strengths" (list of strings),
"growth_areas" (list of strings),
"interview_questions" (list of 4 strings)"""

            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            headers = {"Content-Type": "application/json"}
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"}
            }
            resp = requests.post(url, headers=headers, json=payload, timeout=8)
            if resp.status_code == 200:
                data = resp.json()
                res_text = data['candidates'][0]['content']['parts'][0]['text']
                parsed = json.loads(res_text)
                parsed['grounded_source'] = 'Google Gemini AI'
                return parsed
        except Exception:
            pass

    # If OpenAI API Key is configured
    if api_provider == 'openai' and openai_key:
        try:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {openai_key}",
                "Content-Type": "application/json"
            }
            prompt = f"""Analyze this candidate for the job. Return JSON with 'executive_summary', 'strengths', 'growth_areas', and 'interview_questions'.
Job: {job.title} - {job.raw_description}
Candidate: {candidate.full_name}, {candidate.total_experience_years} yrs exp, Skills: {[s.name for s in candidate.skills]}"""
            payload = {
                "model": "gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt}],
                "response_format": {"type": "json_object"},
                "temperature": 0.2
            }
            resp = requests.post(url, headers=headers, json=payload, timeout=8)
            if resp.status_code == 200:
                data = resp.json()
                parsed = json.loads(data['choices'][0]['message']['content'])
                parsed['grounded_source'] = 'OpenAI GPT-4o-mini'
                return parsed
        except Exception:
            pass
            
    return build_deterministic_insights()
