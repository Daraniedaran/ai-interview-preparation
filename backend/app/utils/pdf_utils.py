import io
import logging
from typing import Optional
from PyPDF2 import PdfReader
from pdfminer.high_level import extract_text as pdfminer_extract
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from datetime import datetime

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_bytes: bytes) -> Optional[str]:
    """Extract text from a PDF file using PyPDF2 with pdfminer fallback."""
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        if text.strip():
            return text
    except Exception as e:
        logger.warning(f"PyPDF2 extraction failed: {e}")

    try:
        text = pdfminer_extract(io.BytesIO(file_bytes))
        return text
    except Exception as e:
        logger.error(f"pdfminer extraction failed: {e}")
        return None


def generate_resume_feedback_pdf(review_data: dict, user_name: str) -> bytes:
    """Generate a PDF report for resume review feedback."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    styles = getSampleStyleSheet()
    primary_color = colors.HexColor("#2563EB")
    success_color = colors.HexColor("#10B981")
    warning_color = colors.HexColor("#F59E0B")
    danger_color = colors.HexColor("#EF4444")

    title_style = ParagraphStyle(
        "Title",
        parent=styles["Title"],
        fontSize=24,
        textColor=primary_color,
        spaceAfter=6,
    )
    heading_style = ParagraphStyle(
        "Heading",
        parent=styles["Heading2"],
        fontSize=14,
        textColor=primary_color,
        spaceBefore=12,
        spaceAfter=6,
    )
    body_style = styles["Normal"]
    body_style.fontSize = 10
    body_style.leading = 16

    story = []

    # Title
    story.append(Paragraph("🎯 Resume Review Report", title_style))
    story.append(Paragraph(f"Candidate: {user_name}", styles["Normal"]))
    story.append(Paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y')}", styles["Normal"]))
    story.append(HRFlowable(width="100%", thickness=2, color=primary_color, spaceAfter=12))

    # Score Summary Table
    story.append(Paragraph("📊 Score Summary", heading_style))
    score_data = [
        ["Metric", "Score", "Rating"],
        ["Overall Resume Score", f"{review_data.get('resume_score', 0):.0f}/100",
         "Good" if review_data.get('resume_score', 0) >= 70 else "Needs Work"],
        ["ATS Compatibility", f"{review_data.get('ats_score', 0):.0f}/100",
         "Good" if review_data.get('ats_score', 0) >= 70 else "Needs Work"],
    ]
    for section, score in review_data.get("section_scores", {}).items():
        score_data.append([section.replace("_", " ").title(), f"{score}/100", "Good" if score >= 70 else "Needs Work"])

    table = Table(score_data, colWidths=[3 * inch, 1.5 * inch, 1.5 * inch])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), primary_color),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 11),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("ALIGN", (1, 0), (2, -1), "CENTER"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ("PADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(table)
    story.append(Spacer(1, 12))

    # AI Feedback
    story.append(Paragraph("🤖 AI Feedback", heading_style))
    story.append(Paragraph(review_data.get("ai_feedback", ""), body_style))

    # Strengths
    story.append(Paragraph("✅ Strengths", heading_style))
    for strength in review_data.get("strengths", []):
        story.append(Paragraph(f"• {strength}", body_style))

    # Weaknesses
    story.append(Paragraph("⚠️ Areas for Improvement", heading_style))
    for weakness in review_data.get("weaknesses", []):
        story.append(Paragraph(f"• {weakness}", body_style))

    # Missing Skills
    story.append(Paragraph("💡 Suggested Skills to Add", heading_style))
    for skill in review_data.get("missing_skills", []):
        story.append(Paragraph(f"• {skill}", body_style))

    # Improvements
    story.append(Paragraph("🚀 Recommended Improvements", heading_style))
    for i, improvement in enumerate(review_data.get("improvements", []), 1):
        story.append(Paragraph(f"{i}. {improvement}", body_style))

    doc.build(story)
    return buffer.getvalue()


def generate_interview_report_pdf(interview_data: dict, user_name: str) -> bytes:
    """Generate a PDF interview performance report."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=0.75*inch, leftMargin=0.75*inch,
                            topMargin=0.75*inch, bottomMargin=0.75*inch)
    styles = getSampleStyleSheet()
    primary_color = colors.HexColor("#2563EB")
    story = []

    title_style = ParagraphStyle("T", parent=styles["Title"], fontSize=22, textColor=primary_color, spaceAfter=6)
    heading_style = ParagraphStyle("H", parent=styles["Heading2"], fontSize=13, textColor=primary_color, spaceBefore=10, spaceAfter=4)

    story.append(Paragraph("🎤 Mock Interview Report", title_style))
    story.append(Paragraph(f"Candidate: {user_name} | Date: {datetime.now().strftime('%B %d, %Y')}", styles["Normal"]))
    story.append(HRFlowable(width="100%", thickness=2, color=primary_color, spaceAfter=10))

    # Scores
    story.append(Paragraph("📊 Performance Scores", heading_style))
    scores_data = [
        ["Category", "Score"],
        ["Overall Score", f"{interview_data.get('overall_score', 0):.0f}/100"],
        ["Technical Knowledge", f"{interview_data.get('technical_score', 0):.0f}/100"],
        ["Communication", f"{interview_data.get('communication_score', 0):.0f}/100"],
        ["Confidence", f"{interview_data.get('confidence_score', 0):.0f}/100"],
        ["Professionalism", f"{interview_data.get('professionalism_score', 0):.0f}/100"],
        ["Grammar", f"{interview_data.get('grammar_score', 0):.0f}/100"],
        ["Completeness", f"{interview_data.get('completeness_score', 0):.0f}/100"],
    ]
    table = Table(scores_data, colWidths=[3*inch, 2*inch])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), primary_color),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ALIGN", (1, 0), (1, -1), "CENTER"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ("PADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(table)
    story.append(Spacer(1, 10))

    # Summary
    story.append(Paragraph("🤖 AI Summary", heading_style))
    story.append(Paragraph(interview_data.get("ai_summary", ""), styles["Normal"]))

    # Strengths
    story.append(Paragraph("✅ Strengths", heading_style))
    for s in interview_data.get("strengths", []):
        story.append(Paragraph(f"• {s}", styles["Normal"]))

    # Improvements
    story.append(Paragraph("🎯 Areas to Improve", heading_style))
    for a in interview_data.get("areas_to_improve", []):
        story.append(Paragraph(f"• {a}", styles["Normal"]))

    # Suggestions
    story.append(Paragraph("💡 Suggestions", heading_style))
    for sg in interview_data.get("suggestions", []):
        story.append(Paragraph(f"• {sg}", styles["Normal"]))

    doc.build(story)
    return buffer.getvalue()
