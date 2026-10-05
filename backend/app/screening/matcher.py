import json
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from backend.app.models.system import Setting
from backend.app.screening.grounding import generate_requirement_matrix
from backend.app.screening.explanation import generate_screening_explanation

DEFAULT_WEIGHTS = {
    'required_skills': 30,
    'experience': 25,
    'technical_skills': 15,
    'projects': 10,
    'education': 10,
    'preferred_skills': 5,
    'certifications': 5
}

def get_current_weights():
    weights = Setting.get_val('scoring_weights', DEFAULT_WEIGHTS)
    if not isinstance(weights, dict):
        return DEFAULT_WEIGHTS
    # Ensure all keys exist
    for k, v in DEFAULT_WEIGHTS.items():
        if k not in weights:
            weights[k] = v
    # Normalize if total != 100
    total = sum(float(weights.get(k, 0)) for k in DEFAULT_WEIGHTS)
    if total <= 0:
        return DEFAULT_WEIGHTS
    return {k: round((float(weights.get(k, 0)) / total) * 100, 1) for k in DEFAULT_WEIGHTS}

def calculate_text_semantic_similarity(text_a, text_b):
    """
    Computes cosine similarity between two texts using TF-IDF.
    """
    if not text_a or not text_b or len(text_a.strip()) < 5 or len(text_b.strip()) < 5:
        return 0.0
    try:
        vectorizer = TfidfVectorizer(stop_words='english', max_features=1000)
        tfidf_matrix = vectorizer.fit_transform([text_a, text_b])
        sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        return float(max(0.0, min(1.0, sim)))
    except Exception:
        return 0.0

def match_candidate_to_job(candidate, job, custom_weights=None):
    """
    Calculates transparent multi-dimensional matching score and detailed breakdown.
    """
    weights = custom_weights or get_current_weights()
    
    raw_text = candidate.resume.raw_text if (candidate.resume and candidate.resume.raw_text) else ""
    cand_skill_names = [s.name.lower() for s in candidate.skills]
    
    req_skills = job.get_required_skills()
    pref_skills = job.get_preferred_skills()
    
    # 1. Required Skills Score (0 - 100)
    matched_reqs = []
    missing_reqs = []
    partial_reqs = []
    potential_concerns = []
    
    if req_skills:
        for req in req_skills:
            req_l = req.lower()
            if req_l in cand_skill_names or re.search(rf'(?<![a-zA-Z0-9#\+]){re.escape(req_l)}(?![a-zA-Z0-9#\+])', raw_text, re.I):
                matched_reqs.append(req)
            else:
                missing_reqs.append(req)
                potential_concerns.append(f"Required skill '{req}' not detected in resume.")
                
        req_match_ratio = len(matched_reqs) / len(req_skills)
        # Add semantic boost if text contains related technical vocabulary
        job_full_desc = f"{job.title} {job.raw_description} {job.responsibilities_text}"
        semantic_sim = calculate_text_semantic_similarity(job_full_desc, raw_text)
        required_skills_score = min(100.0, (req_match_ratio * 85.0) + (semantic_sim * 15.0))
    else:
        # If no explicit required skills listed, base on semantic similarity + skills
        semantic_sim = calculate_text_semantic_similarity(job.raw_description, raw_text)
        required_skills_score = max(50.0, semantic_sim * 100.0)
        
    # 2. Preferred Skills Score (0 - 100)
    matched_prefs = []
    if pref_skills:
        for pref in pref_skills:
            pref_l = pref.lower()
            if pref_l in cand_skill_names or re.search(rf'(?<![a-zA-Z0-9#\+]){re.escape(pref_l)}(?![a-zA-Z0-9#\+])', raw_text, re.I):
                matched_prefs.append(pref)
        preferred_skills_score = (len(matched_prefs) / len(pref_skills)) * 100.0
    else:
        preferred_skills_score = 100.0 if matched_reqs else 70.0
        
    # 3. Experience Score (0 - 100)
    min_exp = float(job.min_experience_years)
    cand_exp = float(candidate.total_experience_years)
    
    if min_exp > 0:
        if cand_exp >= min_exp:
            # Full score with bonus for healthy experience margin
            experience_score = 100.0
        elif cand_exp > 0:
            ratio = cand_exp / min_exp
            experience_score = max(20.0, ratio * 90.0)
            if ratio < 0.7:
                partial_reqs.append(f"Experience: {cand_exp:.1f} yrs detected vs {min_exp:.1f} yrs required")
                potential_concerns.append(f"Experience ({cand_exp:.1f} yrs) is below stated target of {min_exp:.1f}+ yrs.")
            else:
                partial_reqs.append(f"Experience: {cand_exp:.1f} yrs detected (target {min_exp:.1f} yrs)")
        else:
            experience_score = 15.0
            potential_concerns.append("Specific professional experience duration not detected.")
    else:
        # No experience required
        experience_score = 100.0 if cand_exp > 0 else 80.0
        
    # 4. Technical Skills Breadth (0 - 100)
    tech_skills_cand = [s for s in candidate.skills if s.category == 'technical']
    if len(tech_skills_cand) >= 8:
        technical_skills_score = 100.0
    elif len(tech_skills_cand) >= 4:
        technical_skills_score = 80.0
    elif len(tech_skills_cand) >= 2:
        technical_skills_score = 60.0
    elif len(tech_skills_cand) >= 1:
        technical_skills_score = 40.0
    else:
        technical_skills_score = 15.0
        
    # 5. Projects Score (0 - 100)
    if candidate.projects:
        proj_texts = " ".join([f"{p.title} {p.description} {p.technologies}" for p in candidate.projects])
        proj_sim = calculate_text_semantic_similarity(job.raw_description, proj_texts)
        projects_score = min(100.0, 50.0 + (len(candidate.projects) * 15.0) + (proj_sim * 25.0))
    else:
        # Check if project keywords appear in raw text
        if "project" in raw_text.lower():
            projects_score = 50.0
        else:
            projects_score = 25.0
            
    # 6. Education Score (0 - 100)
    cand_edu_str = candidate.highest_education.lower()
    if any(k in cand_edu_str for k in ['master', 'ph.d', 'doctorate', 'm.s', 'mtech', 'mba']):
        education_score = 100.0
    elif any(k in cand_edu_str for k in ['bachelor', 'b.s', 'btech', 'b.e', 'bca', 'degree']):
        education_score = 90.0
    elif any(k in cand_edu_str for k in ['associate', 'diploma']):
        education_score = 70.0
    elif cand_edu_str != 'not detected':
        education_score = 65.0
    else:
        education_score = 30.0
        potential_concerns.append("Formal education credentials not clearly detected.")
        
    # 7. Certifications Score (0 - 100)
    if candidate.certifications:
        certifications_score = min(100.0, 60.0 + len(candidate.certifications) * 20.0)
    else:
        # Certifications are bonus in most jobs
        certifications_score = 40.0
        
    # Calculate Overall Weighted Score
    sub_scores = {
        'required_skills': required_skills_score,
        'preferred_skills': preferred_skills_score,
        'experience': experience_score,
        'technical_skills': technical_skills_score,
        'projects': projects_score,
        'education': education_score,
        'certifications': certifications_score
    }
    
    total_weight = sum(weights.values())
    if total_weight > 0:
        weighted_sum = sum(sub_scores[k] * (weights[k] / 100.0) for k in weights)
        overall_score = max(0.0, min(100.0, weighted_sum))
    else:
        overall_score = required_skills_score
        
    # Grounded matrix
    matrix = generate_requirement_matrix(job, candidate, raw_text)
    
    # Grounded explanation
    summary_exp, verify_tips = generate_screening_explanation(
        candidate=candidate,
        job=job,
        matched_reqs=matched_reqs,
        missing_reqs=missing_reqs,
        partial_reqs=partial_reqs,
        scores=sub_scores
    )
    
    # Suggested grounded interview questions
    interview_questions = []
    if matched_reqs:
        interview_questions.append(f"Can you walk us through a challenging production problem you solved using {matched_reqs[0]}?")
    if len(matched_reqs) > 1:
        interview_questions.append(f"How have you designed architectures that integrate {matched_reqs[1]} in your past projects?")
    if missing_reqs:
        interview_questions.append(f"This role involves {missing_reqs[0]}. Have you had exposure or transferable experience with this technology?")
    if candidate.projects:
        interview_questions.append(f"In your '{candidate.projects[0].title}' project, what architectural tradeoffs or bottlenecks did you face?")
    else:
        interview_questions.append("Can you describe the most complex software feature you have deployed from scratch?")
        
    return {
        'overall_match_score': round(overall_score, 1),
        'sub_scores': {k: round(v, 1) for k, v in sub_scores.items()},
        'matched_requirements': matched_reqs,
        'preferred_matched': matched_prefs,
        'missing_requirements': missing_reqs,
        'partial_requirements': partial_reqs,
        'potential_concerns': potential_concerns,
        'summary_explanation': summary_exp,
        'verification_tips': verify_tips,
        'interview_questions': interview_questions,
        'weights_used': weights,
        'matrix': matrix
    }
