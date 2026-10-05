import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def find_evidence_snippet(needle, haystack_text, max_len=200):
    """
    Finds a coherent sentence or bullet point in haystack_text that mentions needle.
    """
    if not needle or not haystack_text:
        return "Not detected"
        
    sentences = re.split(r'[\n•\r\.\?!]+', haystack_text)
    pattern = rf'(?<![a-zA-Z0-9#\+]){re.escape(needle)}(?![a-zA-Z0-9#\+])'
    
    for s in sentences:
        s_clean = s.strip()
        if len(s_clean) > 8 and re.search(pattern, s_clean, re.I):
            if len(s_clean) > max_len:
                return s_clean[:max_len].rsplit(' ', 1)[0] + "..."
            return s_clean
            
    return "Not detected"

def generate_requirement_matrix(job, candidate, raw_resume_text=""):
    """
    Builds a list of RequirementMatch dicts:
    [Requirement | Candidate Evidence snippet | Status | Relevance Score]
    """
    matrix = []
    text = raw_resume_text or candidate.professional_summary or ""
    cand_skill_names = [s.name.lower() for s in candidate.skills]
    
    # 1. Required Skills
    req_skills = job.get_required_skills()
    for req in req_skills:
        req_clean = req.strip()
        is_matched = req_clean.lower() in cand_skill_names or re.search(rf'(?<![a-zA-Z0-9#\+]){re.escape(req_clean)}(?![a-zA-Z0-9#\+])', text, re.I)
        
        if is_matched:
            evidence = find_evidence_snippet(req_clean, text)
            if evidence == "Not detected":
                evidence = f"Listed in candidate skills profile: '{req_clean}'"
            status = "Matched"
            relevance = 1.0
        else:
            evidence = "Not detected in resume"
            status = "Not Detected"
            relevance = 0.0
            
        matrix.append({
            'requirement_title': req_clean,
            'requirement_type': 'required_skill',
            'match_status': status,
            'candidate_evidence': evidence,
            'relevance_score': relevance
        })
        
    # 2. Preferred Skills
    pref_skills = job.get_preferred_skills()
    for pref in pref_skills:
        pref_clean = pref.strip()
        is_matched = pref_clean.lower() in cand_skill_names or re.search(rf'(?<![a-zA-Z0-9#\+]){re.escape(pref_clean)}(?![a-zA-Z0-9#\+])', text, re.I)
        
        if is_matched:
            evidence = find_evidence_snippet(pref_clean, text)
            if evidence == "Not detected":
                evidence = f"Listed in candidate skills profile: '{pref_clean}'"
            status = "Matched"
            relevance = 1.0
        else:
            evidence = "Not detected in resume"
            status = "Not Detected"
            relevance = 0.0
            
        matrix.append({
            'requirement_title': f"{pref_clean} (Preferred)",
            'requirement_type': 'preferred_skill',
            'match_status': status,
            'candidate_evidence': evidence,
            'relevance_score': relevance
        })
        
    # 3. Experience Requirement
    min_exp = job.min_experience_years
    cand_exp = candidate.total_experience_years
    
    if min_exp > 0:
        if cand_exp >= min_exp:
            exp_status = "Matched"
            exp_evidence = f"{cand_exp:.1f} years detected (meets or exceeds {min_exp:.1f} years required)"
            exp_rel = 1.0
        elif cand_exp >= (min_exp * 0.7):
            exp_status = "Partially Matched"
            exp_evidence = f"{cand_exp:.1f} years detected (slightly below {min_exp:.1f} years target)"
            exp_rel = 0.75
        elif cand_exp > 0:
            exp_status = "Below Requirement"
            exp_evidence = f"{cand_exp:.1f} years detected (target is {min_exp:.1f}+ years)"
            exp_rel = 0.4
        else:
            exp_status = "Not Detected"
            exp_evidence = "Specific work experience duration not detected in resume"
            exp_rel = 0.0
            
        matrix.append({
            'requirement_title': f"{min_exp:.0f}+ Years Experience",
            'requirement_type': 'experience',
            'match_status': exp_status,
            'candidate_evidence': exp_evidence,
            'relevance_score': exp_rel
        })
        
    # 4. Education Requirement
    job_edu = job.education_level or "Bachelor's Degree"
    cand_edu = candidate.highest_education or "Not detected"
    
    if cand_edu != "Not detected":
        edu_status = "Matched"
        edu_evidence = f"{cand_edu}"
        if candidate.education:
            first_edu = candidate.education[0]
            edu_evidence += f" from {first_edu.institution}" if first_edu.institution != 'Institution' else ""
            if first_edu.graduation_year and first_edu.graduation_year != 'Not detected':
                edu_evidence += f" ({first_edu.graduation_year})"
        edu_rel = 1.0
    else:
        edu_status = "Not Detected"
        edu_evidence = "Education details not clearly detected"
        edu_rel = 0.3
        
    matrix.append({
        'requirement_title': f"Education: {job_edu}",
        'requirement_type': 'education',
        'match_status': edu_status,
        'candidate_evidence': edu_evidence,
        'relevance_score': edu_rel
    })
    
    return matrix
