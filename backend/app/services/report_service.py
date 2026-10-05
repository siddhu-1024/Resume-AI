import io
import csv
from datetime import datetime, timezone
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

def generate_candidates_csv(candidates, job=None):
    """
    Generates a CSV string of candidate screening results.
    """
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "Candidate ID",
        "Candidate Name",
        "Job Title",
        "Overall Match (%)",
        "Status",
        "Experience (Years)",
        "Highest Education",
        "Email",
        "Phone",
        "Location",
        "Top Skills",
        "Last Screened"
    ])
    
    for c in candidates:
        latest = c.screening_results[-1] if c.screening_results else None
        match_score = f"{latest.overall_match_score:.1f}%" if latest else "Not Screened"
        screened_at = latest.screened_at.strftime("%Y-%m-%d %H:%M") if latest and latest.screened_at else "N/A"
        skills_str = "; ".join([s.name for s in c.skills[:8]])
        
        writer.writerow([
            c.id,
            c.full_name,
            c.job.title if c.job else (job.title if job else "Unassigned"),
            match_score,
            c.status,
            f"{c.total_experience_years:.1f}",
            c.highest_education,
            c.email,
            c.phone,
            c.location,
            skills_str,
            screened_at
        ])
        
    return output.getvalue()

def generate_screening_pdf_report(job, candidates, stats=None):
    """
    Generates a professional PDF report using ReportLab.
    Returns bytes of the PDF.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#022C22'),
        spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#6B7280'),
        spaceAfter=14
    )
    section_heading = ParagraphStyle(
        'SectionHead',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#064E3B'),
        spaceBefore=12,
        spaceAfter=8
    )
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#1F2937')
    )
    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#1F2937')
    )
    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#022C22')
    )
    
    elements = []
    
    # Title & Header
    elements.append(Paragraph("Resume Screening Assistant — Executive Report", title_style))
    date_str = datetime.now(timezone.utc).strftime("%B %d, %Y at %H:%M UTC")
    job_info = f"Job Position: <b>{job.title}</b> | Department: {job.department} | Generated on: {date_str}" if job else f"All Positions Report | Generated on: {date_str}"
    elements.append(Paragraph(job_info, subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#E8D5B5'), spaceAfter=14))
    
    # Summary Statistics Table
    if stats:
        elements.append(Paragraph("Screening Pipeline Summary", section_heading))
        stat_data = [
            [
                Paragraph("<b>Total Candidates</b>", table_cell_bold),
                Paragraph("<b>Screened</b>", table_cell_bold),
                Paragraph("<b>Shortlisted</b>", table_cell_bold),
                Paragraph("<b>Needs Review</b>", table_cell_bold),
                Paragraph("<b>Average Match</b>", table_cell_bold)
            ],
            [
                Paragraph(str(stats.get('total_candidates', len(candidates))), table_cell),
                Paragraph(str(stats.get('screened_count', 0)), table_cell),
                Paragraph(str(stats.get('shortlisted_count', 0)), table_cell),
                Paragraph(str(stats.get('review_count', 0)), table_cell),
                Paragraph(f"{stats.get('avg_match', 0.0):.1f}%", table_cell)
            ]
        ]
        stat_table = Table(stat_data, colWidths=[105, 105, 105, 105, 120])
        stat_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F8E7C9')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E8D5B5')),
        ]))
        elements.append(stat_table)
        elements.append(Spacer(1, 14))
        
    # Top Ranked Candidates Table
    elements.append(Paragraph("Candidate Screening Rankings", section_heading))
    
    cand_rows = [
        [
            Paragraph("<b>Candidate</b>", table_cell_bold),
            Paragraph("<b>Match %</b>", table_cell_bold),
            Paragraph("<b>Status</b>", table_cell_bold),
            Paragraph("<b>Exp (Yrs)</b>", table_cell_bold),
            Paragraph("<b>Education</b>", table_cell_bold),
            Paragraph("<b>Top Matched Skills</b>", table_cell_bold)
        ]
    ]
    
    # Sort candidates by match score desc
    sorted_candidates = sorted(
        candidates,
        key=lambda c: (c.screening_results[-1].overall_match_score if c.screening_results else -1),
        reverse=True
    )
    
    for c in sorted_candidates[:25]:
        latest = c.screening_results[-1] if c.screening_results else None
        score_str = f"<b>{latest.overall_match_score:.1f}%</b>" if latest else "N/A"
        top_skills = ", ".join([s.name for s in c.skills[:4]]) or "Not detected"
        
        cand_rows.append([
            Paragraph(f"<b>{c.full_name}</b><br/><font color='#6B7280'>{c.email}</font>", table_cell),
            Paragraph(score_str, table_cell),
            Paragraph(c.status, table_cell),
            Paragraph(f"{c.total_experience_years:.1f}", table_cell),
            Paragraph(c.highest_education[:24], table_cell),
            Paragraph(top_skills, table_cell)
        ])
        
    cand_table = Table(cand_rows, colWidths=[120, 55, 65, 55, 110, 135])
    cand_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#FAF4E6')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
    ]))
    elements.append(cand_table)
    elements.append(Spacer(1, 16))
    
    # Responsible Screening Transparency Notice
    notice_text = (
        "<b>Responsible Screening Transparency Notice:</b> "
        "Screening results and match percentages are calculated purely based on job-relevant skills, "
        "experience, education, and project qualifications detected in uploaded resumes. "
        "No protected or demographic characteristics are utilized in scoring. "
        "This report is intended to support and inform, not replace, human recruitment review."
    )
    elements.append(Paragraph(notice_text, subtitle_style))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
