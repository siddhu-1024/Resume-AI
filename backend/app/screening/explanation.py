def generate_screening_explanation(candidate, job, matched_reqs, missing_reqs, partial_reqs, scores):
    """
    Generates transparent, factual reasons why the candidate matches and what needs human verification.
    Strictly grounded in resume data; no protected personal assumptions.
    """
    match_reasons = []
    verification_points = []
    
    # Match reasons
    if matched_reqs:
        top_matched = matched_reqs[:4]
        match_reasons.append(f"Demonstrated core required competencies: {', '.join(top_matched)}.")
        
    if candidate.total_experience_years > 0:
        if job.min_experience_years > 0 and candidate.total_experience_years >= job.min_experience_years:
            match_reasons.append(f"Possesses {candidate.total_experience_years:.1f} years of professional experience, satisfying the {job.min_experience_years:.1f} years job requirement.")
        elif candidate.total_experience_years > 0:
            match_reasons.append(f"Demonstrates {candidate.total_experience_years:.1f} years of related experience.")
            
    if candidate.projects:
        match_reasons.append(f"Includes {len(candidate.projects)} relevant project(s) such as '{candidate.projects[0].title}'.")
        
    if candidate.highest_education and candidate.highest_education != 'Not detected':
        match_reasons.append(f"Academic background in {candidate.highest_education}.")
        
    if not match_reasons:
        match_reasons.append("Resume contains general relevant technical background aligned with role domain.")
        
    # Verification points
    if missing_reqs:
        top_missing = missing_reqs[:3]
        verification_points.append(f"Verify candidate experience with required competencies not explicitly detected in resume: {', '.join(top_missing)}.")
        
    if partial_reqs:
        verification_points.append(f"Explore depth of experience regarding partially matched areas: {', '.join(partial_reqs)}.")
        
    if job.min_experience_years > 0 and candidate.total_experience_years < job.min_experience_years:
        verification_points.append(f"Evaluate hands-on project depth to assess if practical experience compensates for {candidate.total_experience_years:.1f} detected vs {job.min_experience_years:.1f} desired years.")
        
    if not candidate.projects and scores.get('projects', 0) < 50:
        verification_points.append("Ask for specific architectural examples or code samples since standalone project section was not detected.")
        
    if not verification_points:
        verification_points.append("Confirm practical expertise in core production systems and team collaboration workflows during technical interview.")
        
    summary_text = " ".join(match_reasons)
    verify_text = " ".join(verification_points)
    
    return summary_text, verify_text
