import os
import pytest
from backend.app.parsers.pdf_parser import extract_text_from_pdf
from backend.app.parsers.docx_parser import extract_text_from_docx
from backend.app.parsers.resume_extractor import (
    parse_resume_content,
    extract_email,
    extract_phone,
    extract_skills_from_text,
    calculate_experience_years
)
from backend.app.parsers.job_analyzer import analyze_job_description

def test_extract_text_from_sample_pdf():
    pdf_path = "sample_resumes/sample_strong_fullstack.pdf"
    assert os.path.exists(pdf_path), "Sample PDF should exist"
    text, pages, meta, err = extract_text_from_pdf(pdf_path)
    assert err is None
    assert pages >= 1
    assert "Elena Rostova" in text
    assert "FastAPI" in text or "Python" in text

def test_extract_text_from_sample_docx():
    docx_path = "sample_resumes/sample_frontend_developer.docx"
    assert os.path.exists(docx_path), "Sample DOCX should exist"
    text, paras, meta, err = extract_text_from_docx(docx_path)
    assert err is None
    assert "David Kim" in text
    assert "React" in text

def test_extract_contact_info():
    sample_text = "John Doe | john.doe@techcorp.io | +1 (555) 234-5678 | San Francisco, CA"
    email = extract_email(sample_text)
    phone = extract_phone(sample_text)
    assert email == "john.doe@techcorp.io"
    assert phone is not None
    assert "555" in phone

def test_extract_skills():
    text = "Proficient in Python, Django, PostgreSQL, Docker, AWS, React, and Git. Strong leadership and teamwork."
    tech, soft = extract_skills_from_text(text)
    assert "Python" in tech
    assert "PostgreSQL" in tech
    assert "Docker" in tech
    assert "Leadership" in soft or "Teamwork" in soft

def test_calculate_experience_years():
    text = "Work History: Senior Software Engineer at TechCo (2018 - 2023)\nSoftware Intern (2017 - 2018)"
    years = calculate_experience_years(text)
    assert years >= 5.0

def test_parse_structured_resume():
    raw_text = """
    Jane Smith
    Seattle, WA | jane.smith@gmail.com | +1 (206) 555-0199
    
    PROFESSIONAL SUMMARY
    Backend engineer with 4+ years experience in Python and Flask.
    
    SKILLS
    Python, Flask, PostgreSQL, Docker, Git
    
    EXPERIENCE
    Backend Developer | CloudScale (2020 - 2024)
    • Developed REST APIs in Python Flask.
    
    EDUCATION
    Bachelor of Science in Computer Science | University of Washington (2020)
    """
    parsed = parse_resume_content(raw_text)
    assert parsed['full_name'] == "Jane Smith"
    assert parsed['email'] == "jane.smith@gmail.com"
    assert "Python" in parsed['technical_skills']
    assert len(parsed['experiences']) >= 1
    assert "Computer Science" in parsed['highest_education']

def test_analyze_job_description():
    job_text = """
    We are looking for a Senior Python Developer with 4+ years experience.
    Must have: Python, FastAPI, Docker, SQL.
    Nice to have: React, AWS.
    Education: Bachelor's degree in Computer Science or related.
    """
    analysis = analyze_job_description("Senior Python Developer", job_text)
    assert "Python" in analysis['required_skills'] or "Python" in analysis['technical_skills']
    assert analysis['min_experience_years'] >= 4.0
    assert "Bachelor" in analysis['education_requirement']

def test_corrupt_file_handling():
    corrupt_bytes = b"NOT_A_REAL_PDF_HEADER_JUST_GARBAGE"
    text, pages, meta, err = extract_text_from_pdf(corrupt_bytes)
    assert err is not None
    assert text == ""
