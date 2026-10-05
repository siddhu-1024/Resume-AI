import re
from backend.app.parsers.resume_extractor import (
    TECHNICAL_SKILLS,
    SOFT_SKILLS,
    DEGREE_PATTERNS,
    clean_text_lines,
    extract_skills_from_text
)

def extract_job_experience_requirement(text):
    """
    Extracts minimum required experience years from job description.
    e.g. "3+ years of experience", "minimum 5 years", "2-4 years" -> 3.0 / 5.0 / 2.0
    """
    patterns = [
        r'(?i)(?:minimum|at least)\s*(\d+(?:\.\d+)?)\s*(?:\+|-|\s*to\s*\d+)?\s*(?:years|yrs)',
        r'(?i)(\d+(?:\.\d+)?)\+?\s*(?:years|yrs)(?:\s+of)?\s+(?:relevant|professional|software|industry|work)?\s*experience',
        r'(?i)experience\s*(?:required|needed|of)\s*:\s*(\d+(?:\.\d+)?)\+?\s*(?:years|yrs)',
        r'(?i)(\d+)\s*-\s*(\d+)\s*(?:years|yrs)'
    ]
    
    for pat in patterns:
        m = re.search(pat, text)
        if m:
            try:
                return float(m.group(1))
            except Exception:
                pass
    return 0.0

def extract_job_education_requirement(text):
    """
    Extracts minimum education requirement from job description.
    """
    for pat in DEGREE_PATTERNS:
        m = re.search(pat, text)
        if m:
            degree_found = m.group(0).strip()
            if any(d in degree_found.lower() for d in ['ph.d', 'doctorate', 'phd']):
                return "Ph.D. / Doctorate"
            elif any(d in degree_found.lower() for d in ['master', 'm.s', 'mtech', 'mba', 'mca']):
                return "Master's Degree"
            elif any(d in degree_found.lower() for d in ['bachelor', 'b.s', 'btech', 'b.e', 'bca']):
                return "Bachelor's Degree"
            else:
                return degree_found.title()
    return "Bachelor's Degree or equivalent"

def split_job_sections(text):
    lines = clean_text_lines(text)
    sections = {
        'required': [],
        'preferred': [],
        'responsibilities': [],
        'qualifications': [],
        'general': []
    }
    
    current_sec = 'general'
    
    for line in lines:
        cleaned = line.strip(' :#-–|*').lower()
        if len(cleaned.split()) <= 5:
            if any(k in cleaned for k in ['must have', 'required', 'requirements', 'minimum qualification', 'what you need', 'core skill']):
                current_sec = 'required'
                continue
            elif any(k in cleaned for k in ['nice to have', 'preferred', 'plus', 'bonus', 'desired', 'good to have']):
                current_sec = 'preferred'
                continue
            elif any(k in cleaned for k in ['responsibilities', 'duties', 'what you will do', 'role overview', 'key responsibilities']):
                current_sec = 'responsibilities'
                continue
            elif any(k in cleaned for k in ['qualifications', 'background', 'eligibility', 'profile']):
                current_sec = 'qualifications'
                continue
                
        sections[current_sec].append(line)
        
    return {k: "\n".join(v).strip() for k, v in sections.items()}

def analyze_job_description(title, description, responsibilities="", qualifications=""):
    """
    Comprehensive analyzer for Job Descriptions.
    Extracts structured requirements, skills, experience, and responsibilities.
    """
    full_text = f"{title}\n{description}\n{responsibilities}\n{qualifications}".strip()
    
    sections = split_job_sections(full_text)
    
    # Extract overall skills
    tech_skills, soft_skills = extract_skills_from_text(full_text)
    
    # Distinguish required vs preferred skills
    preferred_text = sections.get('preferred', '')
    required_text = (
        sections.get('required', '') + "\n" +
        sections.get('qualifications', '') + "\n" +
        title
    )
    
    preferred_tech, preferred_soft = extract_skills_from_text(preferred_text)
    pref_set = set(preferred_tech + preferred_soft)
    
    # Required skills are all skills found not solely in the preferred section
    required_skills = [s for s in tech_skills if s not in pref_set]
    preferred_skills = [s for s in tech_skills if s in pref_set]
    
    # If title has specific key tech (e.g. Python, React), ensure it's in required skills
    title_tech, _ = extract_skills_from_text(title)
    for t in title_tech:
        if t not in required_skills:
            required_skills.insert(0, t)
        if t in preferred_skills:
            preferred_skills.remove(t)
            
    # Extract minimum experience & education
    min_exp = extract_job_experience_requirement(full_text)
    min_edu = extract_job_education_requirement(full_text)
    
    # Extract responsibilities bullet points
    resp_text = responsibilities or sections.get('responsibilities', '')
    resp_bullets = []
    if resp_text:
        for line in clean_text_lines(resp_text):
            cleaned = re.sub(r'^[•\-\*\d\.\s]+', '', line).strip()
            if len(cleaned) > 10:
                resp_bullets.append(cleaned)
                
    # Extract keywords
    words = re.findall(r'\b[A-Za-z0-9+#.-]{3,}\b', full_text)
    common_stops = {'the', 'and', 'for', 'with', 'that', 'this', 'have', 'from', 'will', 'you', 'are', 'your', 'about', 'join', 'team', 'work', 'job', 'role'}
    freq = {}
    for w in words:
        wl = w.lower()
        if wl not in common_stops and len(wl) > 2:
            freq[wl] = freq.get(wl, 0) + 1
            
    top_keywords = sorted(freq.keys(), key=lambda k: freq[k], reverse=True)[:15]
    
    return {
        'required_skills': required_skills,
        'preferred_skills': preferred_skills,
        'technical_skills': tech_skills,
        'soft_skills': soft_skills,
        'min_experience_years': min_exp,
        'education_requirement': min_edu,
        'responsibilities': resp_bullets[:10],
        'keywords': top_keywords,
        'sections': sections
    }
