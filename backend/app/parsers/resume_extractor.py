import re
from datetime import datetime, timezone

# Common technical and soft skills taxonomy
TECHNICAL_SKILLS = [
    # Languages
    "python", "javascript", "typescript", "java", "c++", "c#", "c", "golang", "go", "rust",
    "ruby", "php", "scala", "kotlin", "swift", "dart", "r", "matlab", "bash", "shell", "powershell",
    "sql", "pl/sql", "t-sql", "html", "html5", "css", "css3", "sass", "scss",
    # Frameworks & Libraries
    "react", "react.js", "react native", "angular", "vue.js", "vue", "next.js", "nuxt.js", "svelte",
    "node.js", "nodejs", "express", "express.js", "flask", "django", "fastapi", "spring", "spring boot",
    "asp.net", ".net", ".net core", "laravel", "rails", "ruby on rails", "jquery", "bootstrap", "tailwind css", "tailwind",
    # Databases & Caching
    "postgresql", "postgres", "mysql", "sqlite", "mongodb", "redis", "elasticsearch", "cassandra",
    "dynamodb", "oracle", "mssql", "sql server", "mariadb", "neo4j", "supabase", "firebase",
    # Cloud & DevOps
    "aws", "amazon web services", "azure", "gcp", "google cloud", "google cloud platform",
    "docker", "kubernetes", "k8s", "terraform", "ansible", "jenkins", "gitlab ci", "github actions",
    "circleci", "helm", "linux", "unix", "nginx", "apache", "serverless", "lambda",
    # Architecture & APIs
    "rest", "rest api", "restful apis", "restful", "graphql", "grpc", "microservices",
    "system design", "distributed systems", "event-driven architecture", "kafka", "rabbitmq", "celery",
    "websockets", "oauth", "jwt", "api gateway",
    # AI / ML & Data
    "machine learning", "deep learning", "nlp", "computer vision", "llm", "genai", "prompt engineering",
    "scikit-learn", "sklearn", "pandas", "numpy", "scipy", "tensorflow", "pytorch", "keras",
    "opencv", "spacy", "nltk", "huggingface", "langchain", "spark", "hadoop", "airflow",
    # Testing & Tools
    "git", "github", "gitlab", "bitbucket", "jira", "confluence", "postman", "swagger",
    "pytest", "unittest", "jest", "mocha", "cypress", "selenium", "playwright", "junit",
    "webpack", "vite", "babel", "npm", "yarn", "pnpm", "poetry"
]

SOFT_SKILLS = [
    "leadership", "team leadership", "communication", "verbal communication", "written communication",
    "problem solving", "critical thinking", "collaboration", "cross-functional collaboration",
    "teamwork", "adaptability", "flexibility", "time management", "project management",
    "agile", "scrum", "kanban", "mentorship", "mentoring", "conflict resolution",
    "negotiation", "stakeholder management", "analytical skills", "creativity",
    "decision making", "interpersonal skills", "self-motivated", "attention to detail"
]

DEGREE_PATTERNS = [
    r"(?i)\b(ph\.?d\.?|doctor of philosophy|doctorate)\b",
    r"(?i)\b(m\.?s\.?|m\.?sc\.?|m\.?tech\.?|m\.?e\.?|master of science|master of technology|master of engineering|m\.?b\.?a\.?|master of business administration|m\.?c\.?a\.?|master of computer applications)\b",
    r"(?i)\b(b\.?s\.?|b\.?sc\.?|b\.?tech\.?|b\.?e\.?|bachelor of science|bachelor of technology|bachelor of engineering|b\.?c\.?a\.?|bachelor of computer applications|b\.?a\.?|bachelor of arts|b\.?com\.?|bachelor of commerce|bachelor's|bachelors)\b",
    r"(?i)\b(associate degree|diploma)\b"
]

def clean_text_lines(text):
    if not text:
        return []
    lines = [line.strip() for line in text.splitlines()]
    return [l for l in lines if l]

def extract_email(text):
    pattern = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
    matches = re.findall(pattern, text)
    if matches:
        # Ignore dummy placeholder emails if possible
        for m in matches:
            if not m.lower().endswith(('.png', '.jpg', '.jpeg')):
                return m
    return None

def extract_phone(text):
    # Matches +1-xxx-xxx-xxxx, +91 xxxxx xxxxx, (xxx) xxx-xxxx, xxx.xxx.xxxx, etc.
    pattern = r'(?:(?:\+\d{1,3}[\s-]?)?(?:\(?\d{3}\)?[\s-]?)?\d{3}[\s.-]?\d{4}|\+\d{1,3}[\s-]?\d{9,11})'
    matches = re.findall(pattern, text)
    for m in matches:
        cleaned = re.sub(r'[^\d+]', '', m)
        if 9 <= len(cleaned) <= 15:
            return m.strip()
    return None

def extract_urls(text):
    linkedin = None
    github = None
    portfolio = None
    
    # LinkedIn
    li_match = re.search(r'(?:https?://)?(?:www\.)?linkedin\.com/in/([a-zA-Z0-9_-]+)', text, re.I)
    if li_match:
        linkedin = f"https://linkedin.com/in/{li_match.group(1)}"
        
    # GitHub
    gh_match = re.search(r'(?:https?://)?(?:www\.)?github\.com/([a-zA-Z0-9_-]+)', text, re.I)
    if gh_match:
        github = f"https://github.com/{gh_match.group(1)}"
        
    # Portfolio / other sites
    port_match = re.search(r'(?:https?://)?([a-zA-Z0-9_-]+\.(?:dev|io|me|vercel\.app|netlify\.app|portfolio|org))', text, re.I)
    if port_match and not linkedin and not github:
        portfolio = f"https://{port_match.group(1)}"
        
    return linkedin, github, portfolio

def extract_name(text):
    """
    Heuristically extracts candidate name from the top header lines.
    """
    lines = clean_text_lines(text)[:10]
    excluded_keywords = [
        'resume', 'curriculum', 'vitae', 'cv', 'page', 'profile', 'summary',
        'contact', 'experience', 'education', 'skills', 'phone', 'email',
        'http', 'www', 'linkedin', 'github', 'developer', 'engineer', 'architect'
    ]
    
    for line in lines:
        cleaned = line.strip()
        # Clean bullet points, pipes, special chars
        cleaned = re.sub(r'^[•\-\*\#\|\s]+', '', cleaned)
        cleaned = re.sub(r'\|.*$', '', cleaned).strip()
        
        words = cleaned.split()
        if 2 <= len(words) <= 4:
            lower = cleaned.lower()
            if any(k in lower for k in excluded_keywords):
                continue
            # Check if words look like proper names (starts with capital or uppercase)
            if all(re.match(r'^[A-Z][a-zA-Z\.\'\-]*$', w) or w.isupper() for w in words):
                return cleaned.title() if cleaned.isupper() else cleaned
                
    # Fallback to first non-empty line if it has 2-3 alphabetic words
    for line in lines:
        words = re.findall(r'[a-zA-Z]+', line)
        if 2 <= len(words) <= 3:
            if not any(k in line.lower() for k in excluded_keywords):
                return " ".join(w.capitalize() for w in words)
                
    return "Unknown Candidate"

def extract_location(text):
    lines = clean_text_lines(text)[:15]
    common_cities = [
        "New York", "San Francisco", "Seattle", "Austin", "Boston", "Chicago", "Los Angeles",
        "London", "Toronto", "Vancouver", "Berlin", "Paris", "Bangalore", "Bengaluru", "Hyderabad",
        "Mumbai", "Pune", "Delhi", "Singapore", "Sydney", "Remote", "Dublin", "Amsterdam"
    ]
    
    # Look for City, State / Country patterns
    for line in lines:
        for city in common_cities:
            if re.search(rf'\b{re.escape(city)}\b', line, re.I):
                # Check for "City, State" or "City, Country"
                match = re.search(rf'({re.escape(city)}(?:,\s*[A-Z]{{2}}|,\s*[A-Za-z\s]+)?)', line, re.I)
                if match:
                    return match.group(1).strip(' ,-|')
                    
    # Generic City, ST pattern
    loc_match = re.search(r'\b([A-Z][a-zA-Z\s]+,\s*[A-Z]{2}(?:\s+\d{5})?)\b', text[:1000])
    if loc_match:
        return loc_match.group(1).strip()
        
    return "Not detected"

def extract_skills_from_text(text):
    text_lower = " " + text.lower() + " "
    found_tech = []
    found_soft = []
    
    for skill in TECHNICAL_SKILLS:
        # Regex boundary check, accounting for skills like C++, C#, .NET, Node.js
        pattern = rf'(?<![a-zA-Z0-9#\+]){re.escape(skill)}(?![a-zA-Z0-9#\+])'
        if re.search(pattern, text_lower):
            # Canonical name formatting
            canonical = skill
            if skill in ['react', 'react.js']: canonical = 'React'
            elif skill in ['node.js', 'nodejs']: canonical = 'Node.js'
            elif skill in ['vue', 'vue.js']: canonical = 'Vue.js'
            elif skill in ['next.js']: canonical = 'Next.js'
            elif skill in ['c#']: canonical = 'C#'
            elif skill in ['c++']: canonical = 'C++'
            elif skill in ['.net', '.net core']: canonical = '.NET'
            elif skill in ['aws']: canonical = 'AWS'
            elif skill in ['gcp']: canonical = 'GCP'
            elif skill in ['sql']: canonical = 'SQL'
            elif skill in ['postgresql', 'postgres']: canonical = 'PostgreSQL'
            elif skill in ['mongodb']: canonical = 'MongoDB'
            elif skill in ['ci/cd']: canonical = 'CI/CD'
            elif skill in ['rest', 'rest api', 'restful apis', 'restful']: canonical = 'REST APIs'
            elif skill in ['graphql']: canonical = 'GraphQL'
            elif skill in ['docker']: canonical = 'Docker'
            elif skill in ['kubernetes', 'k8s']: canonical = 'Kubernetes'
            elif skill in ['python']: canonical = 'Python'
            elif skill in ['javascript']: canonical = 'JavaScript'
            elif skill in ['typescript']: canonical = 'TypeScript'
            else: canonical = skill.title()
            
            if canonical not in found_tech:
                found_tech.append(canonical)
                
    for skill in SOFT_SKILLS:
        pattern = rf'(?<![a-zA-Z0-9]){re.escape(skill)}(?![a-zA-Z0-9])'
        if re.search(pattern, text_lower):
            canonical = skill.title()
            if canonical not in found_soft:
                found_soft.append(canonical)
                
    return found_tech, found_soft

def extract_sections(text):
    """
    Splits resume into identified sections.
    """
    section_headers = {
        'summary': r'(?i)^(?:professional\s+)?(?:summary|profile|about\s+me|objective)\b',
        'experience': r'(?i)^(?:work\s+|professional\s+)?(?:experience|employment|history|work\s+history)\b',
        'education': r'(?i)^(?:education|academic\s+background|academics|qualifications)\b',
        'skills': r'(?i)^(?:technical\s+|core\s+)?(?:skills|competencies|technologies|proficiencies|tools)\b',
        'projects': r'(?i)^(?:projects|personal\s+projects|key\s+projects|portfolio)\b',
        'certifications': r'(?i)^(?:certifications|certificates|licenses|credentials|courses)\b',
        'achievements': r'(?i)^(?:achievements|awards|honors|publications)\b',
        'languages': r'(?i)^(?:languages|spoken\s+languages)\b'
    }
    
    lines = clean_text_lines(text)
    sections = {k: [] for k in section_headers}
    sections['header'] = []
    
    current_section = 'header'
    
    for line in lines:
        cleaned_line = line.strip(' :#-–|')
        matched_section = None
        
        # Check if line looks like a header (short length, uppercase or bold styled text)
        if len(cleaned_line.split()) <= 4:
            for sec_name, sec_regex in section_headers.items():
                if re.match(sec_regex, cleaned_line):
                    matched_section = sec_name
                    break
                    
        if matched_section:
            current_section = matched_section
        else:
            sections[current_section].append(line)
            
    # Convert lists to strings
    return {k: "\n".join(v).strip() for k, v in sections.items()}

def calculate_experience_years(text):
    """
    Parses date ranges (e.g. 2018 - 2023, Jan 2020 - Present, 03/2019 to 08/2021)
    and estimates total experience years.
    """
    current_year = datetime.now(timezone.utc).year
    
    # Look for explicit mentions like "5+ years of experience"
    exp_mention = re.search(r'(\d+(?:\.\d+)?)\+?\s*(?:years|yrs)(?:\s+of)?\s+experience', text, re.I)
    if exp_mention:
        try:
            return float(exp_mention.group(1))
        except Exception:
            pass
            
    # Look for year ranges: 2018 - 2022, 2020 - Present
    date_range_pattern = r'(?i)\b(20\d{2}|19\d{2})\s*(?:[-–—to]+)\s*(20\d{2}|19\d{2}|present|current|now)\b'
    matches = re.findall(date_range_pattern, text)
    
    ranges = []
    for start_str, end_str in matches:
        try:
            start_y = int(start_str)
            end_y = current_year if end_str.lower() in ['present', 'current', 'now'] else int(end_str)
            if 1980 <= start_y <= end_y <= current_year + 1:
                ranges.append((start_y, end_y))
        except Exception:
            continue
            
    if not ranges:
        return 0.0
        
    # Merge overlapping year intervals
    ranges.sort(key=lambda x: x[0])
    merged = []
    for start, end in ranges:
        if not merged:
            merged.append([start, end])
        else:
            prev_start, prev_end = merged[-1]
            if start <= prev_end:
                merged[-1][1] = max(prev_end, end)
            else:
                merged.append([start, end])
                
    total_years = sum(end - start for start, end in merged)
    # If jobs are within the same year, count as 1 year minimum if at least 1 job
    if total_years == 0 and len(ranges) > 0:
        total_years = 1.0
        
    return float(max(total_years, 0.0))

def parse_work_experiences(exp_text):
    if not exp_text:
        return []
        
    experiences = []
    lines = clean_text_lines(exp_text)
    
    current_exp = None
    date_pattern = r'(?i)\b(?:(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?(20\d{2}|19\d{2})\s*(?:[-–—to]+)\s*(?:(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?(20\d{2}|19\d{2}|present|current|now)\b'
    
    for line in lines:
        date_match = re.search(date_pattern, line)
        if date_match:
            if current_exp:
                experiences.append(current_exp)
                
            matched_date_str = date_match.group(0)
            is_present = any(w in matched_date_str.lower() for w in ['present', 'current', 'now'])
            
            # Text before or around date might be title/company
            parts = re.split(date_pattern, line)
            title_company_part = parts[0].strip(' -–|,') if parts else ''
            
            # Split title and company if separated by comma, pipe, or 'at'
            job_title = 'Role'
            company_name = 'Company'
            if title_company_part:
                if ' at ' in title_company_part:
                    t, c = title_company_part.split(' at ', 1)
                    job_title, company_name = t.strip(), c.strip()
                elif ' | ' in title_company_part:
                    t, c = title_company_part.split(' | ', 1)
                    job_title, company_name = t.strip(), c.strip()
                elif ',' in title_company_part:
                    t, c = title_company_part.split(',', 1)
                    job_title, company_name = t.strip(), c.strip()
                else:
                    job_title = title_company_part
                    
            current_exp = {
                'job_title': job_title or 'Professional Role',
                'company_name': company_name or 'Company',
                'location': 'Not detected',
                'start_date': date_match.group(2) if date_match.group(2) else '',
                'end_date': 'Present' if is_present else (date_match.group(4) if date_match.group(4) else ''),
                'is_current': is_present,
                'duration_months': 0,
                'description': ''
            }
        else:
            if current_exp:
                if current_exp['description']:
                    current_exp['description'] += "\n" + line
                else:
                    current_exp['description'] = line
            else:
                # If no date found yet but lines exist
                if not current_exp:
                    current_exp = {
                        'job_title': line,
                        'company_name': 'Company',
                        'location': 'Not detected',
                        'start_date': '',
                        'end_date': '',
                        'is_current': False,
                        'duration_months': 0,
                        'description': ''
                    }
                    
    if current_exp:
        experiences.append(current_exp)
        
    return experiences[:8]

def parse_education(edu_text):
    if not edu_text:
        return []
        
    education_entries = []
    lines = clean_text_lines(edu_text)
    
    current_edu = None
    
    for line in lines:
        has_degree = any(re.search(pat, line) for pat in DEGREE_PATTERNS)
        year_match = re.search(r'\b(20\d{2}|19\d{2})\b', line)
        
        if has_degree or year_match:
            if current_edu:
                education_entries.append(current_edu)
                
            degree_str = "Degree"
            # Try to capture full degree with field e.g. "Bachelor of Science in Computer Science"
            full_deg_m = re.search(r'(?i)\b((?:Bachelor|Master|Doctor|Ph\.?D|B\.?S|M\.?S|B\.?Tech|M\.?Tech|B\.?E|M\.?E)[A-Za-z\s\.]*(?:\s+in\s+[A-Za-z\s]+)?)\b', line.split('|')[0].split(',')[0])
            if full_deg_m and len(full_deg_m.group(1).split()) <= 8:
                degree_str = full_deg_m.group(1).strip()
            else:
                for pat in DEGREE_PATTERNS:
                    m = re.search(pat, line)
                    if m:
                        degree_str = m.group(0).strip()
                        break
                    
            grad_year = year_match.group(1) if year_match else "Not detected"
            
            # Look for institution words like University, College, Institute, School
            inst_match = re.search(r'([A-Za-z\s]+(?:University|College|Institute|School|Academy)[A-Za-z\s]*)', line, re.I)
            institution = inst_match.group(1).strip() if inst_match else (line if not has_degree else "Institution")
            
            current_edu = {
                'degree': degree_str,
                'field_of_study': 'Computer Science / Engineering' if 'computer' in line.lower() or 'tech' in line.lower() else 'Relevant Field',
                'institution': institution,
                'graduation_year': grad_year,
                'grade_or_gpa': 'Not detected'
            }
        else:
            if current_edu:
                if 'gpa' in line.lower() or 'grade' in line.lower():
                    gpa_m = re.search(r'(?:gpa|cgpa|grade)[:\s]*([0-9\.]+(?:/[0-9\.]+)?%?)', line, re.I)
                    if gpa_m:
                        current_edu['grade_or_gpa'] = gpa_m.group(1)
                elif current_edu['institution'] == 'Institution':
                    current_edu['institution'] = line
                    
    if current_edu:
        education_entries.append(current_edu)
        
    return education_entries[:4]

def parse_projects(proj_text):
    if not proj_text:
        return []
        
    projects = []
    lines = clean_text_lines(proj_text)
    current_proj = None
    
    for line in lines:
        # If line starts with bold or clean header or bullet point
        if (len(line.split()) <= 6 and not line.startswith(('•', '-', '*'))) or not current_proj:
            if current_proj and current_proj['description']:
                projects.append(current_proj)
            
            # Detect technologies in title (e.g. "Inventory System - Python, React")
            parts = re.split(r'[-–:|]', line)
            title = parts[0].strip()
            tech = parts[1].strip() if len(parts) > 1 else ""
            
            current_proj = {
                'title': title or 'Key Project',
                'description': '',
                'technologies': tech,
                'url': ''
            }
        else:
            if current_proj:
                if current_proj['description']:
                    current_proj['description'] += " " + line
                else:
                    current_proj['description'] = line
                    
    if current_proj:
        projects.append(current_proj)
        
    return projects[:6]

def parse_certifications(cert_text):
    if not cert_text:
        return []
    certs = []
    lines = clean_text_lines(cert_text)
    for line in lines:
        cleaned = re.sub(r'^[•\-\*\s]+', '', line).strip()
        if cleaned and len(cleaned) > 3:
            certs.append({
                'name': cleaned,
                'issuing_organization': 'Issuing Body',
                'issue_date': 'Detected',
                'credential_id': ''
            })
    return certs[:6]

def parse_resume_content(raw_text):
    """
    Main entry point for structured resume parsing.
    Returns a comprehensive dict of extracted entities.
    """
    if not raw_text or not raw_text.strip():
        return {
            'full_name': 'Unknown Candidate',
            'email': 'Not detected',
            'phone': 'Not detected',
            'location': 'Not detected',
            'linkedin_url': '',
            'github_url': '',
            'portfolio_url': '',
            'professional_summary': 'Not detected',
            'total_experience_years': 0.0,
            'highest_education': 'Not detected',
            'skills': [],
            'technical_skills': [],
            'soft_skills': [],
            'experiences': [],
            'education': [],
            'projects': [],
            'certifications': [],
            'sections': {}
        }
        
    sections = extract_sections(raw_text)
    
    # 1. Contact & Identity
    email = extract_email(raw_text) or 'Not detected'
    phone = extract_phone(raw_text) or 'Not detected'
    linkedin, github, portfolio = extract_urls(raw_text)
    name = extract_name(raw_text)
    location = extract_location(raw_text)
    
    # 2. Professional Summary
    summary = sections.get('summary', '')
    if not summary:
        # Check first 2 paragraphs for summary
        header_lines = clean_text_lines(sections.get('header', ''))[2:6]
        if header_lines:
            summary = " ".join(header_lines)
    summary = summary or 'Not detected'
    
    # 3. Skills
    tech_skills, soft_skills = extract_skills_from_text(raw_text)
    all_skills = [{'name': s, 'category': 'technical'} for s in tech_skills] + \
                 [{'name': s, 'category': 'soft'} for s in soft_skills]
                 
    # 4. Experience & Total Years
    exp_text = sections.get('experience', '')
    experiences = parse_work_experiences(exp_text) if exp_text else []
    total_exp_years = calculate_experience_years(raw_text)
    
    # 5. Education
    edu_text = sections.get('education', '')
    education_list = parse_education(edu_text) if edu_text else []
    highest_edu = education_list[0]['degree'] if education_list else 'Not detected'
    
    # 6. Projects & Certifications
    proj_text = sections.get('projects', '')
    projects = parse_projects(proj_text) if proj_text else []
    
    cert_text = sections.get('certifications', '')
    certifications = parse_certifications(cert_text) if cert_text else []
    
    return {
        'full_name': name,
        'email': email,
        'phone': phone,
        'location': location,
        'linkedin_url': linkedin or '',
        'github_url': github or '',
        'portfolio_url': portfolio or '',
        'professional_summary': summary,
        'total_experience_years': total_exp_years,
        'highest_education': highest_edu,
        'skills': all_skills,
        'technical_skills': tech_skills,
        'soft_skills': soft_skills,
        'experiences': experiences,
        'education': education_list,
        'projects': projects,
        'certifications': certifications,
        'sections': sections
    }
