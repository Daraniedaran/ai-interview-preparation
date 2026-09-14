import io
import logging
from typing import Optional
from xml.sax.saxutils import escape as _xml_escape
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


def _safe_text(value) -> str:
    """Coerce None -> '' and escape XML chars for reportlab Paragraph."""
    if value is None:
        return ""
    return _xml_escape(str(value))


def _safe_list(value) -> list:
    if not value:
        return []
    if isinstance(value, (list, tuple)):
        return [v for v in value if v is not None]
    return [value]


def _safe_score(value) -> float:
    try:
        if value is None:
            return 0
        return float(value)
    except (TypeError, ValueError):
        return 0


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
    story.append(Paragraph(f"Candidate: {_safe_text(user_name)}", styles["Normal"]))
    story.append(Paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y')}", styles["Normal"]))
    story.append(HRFlowable(width="100%", thickness=2, color=primary_color, spaceAfter=12))

    # Score Summary Table
    story.append(Paragraph("📊 Score Summary", heading_style))
    resume_score = _safe_score(review_data.get('resume_score', 0))
    ats_score = _safe_score(review_data.get('ats_score', 0))
    score_data = [
        ["Metric", "Score", "Rating"],
        ["Overall Resume Score", f"{resume_score:.0f}/100",
         "Good" if resume_score >= 70 else "Needs Work"],
        ["ATS Compatibility", f"{ats_score:.0f}/100",
         "Good" if ats_score >= 70 else "Needs Work"],
    ]
    for section, score in (review_data.get("section_scores", {}) or {}).items():
        try:
            s = float(score)
        except (TypeError, ValueError):
            s = 0
        story_section = _safe_text(section).replace("_", " ").title() or str(section)
        score_data.append([story_section, f"{s:.0f}/100", "Good" if s >= 70 else "Needs Work"])

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
    story.append(Paragraph(_safe_text(review_data.get("ai_feedback", "")), body_style))

    # Strengths
    story.append(Paragraph("✅ Strengths", heading_style))
    for strength in _safe_list(review_data.get("strengths", [])):
        story.append(Paragraph(f"• {_safe_text(strength)}", body_style))

    # Weaknesses
    story.append(Paragraph("⚠️ Areas for Improvement", heading_style))
    for weakness in _safe_list(review_data.get("weaknesses", [])):
        story.append(Paragraph(f"• {_safe_text(weakness)}", body_style))

    # Missing Skills
    story.append(Paragraph("💡 Suggested Skills to Add", heading_style))
    for skill in _safe_list(review_data.get("missing_skills", [])):
        story.append(Paragraph(f"• {_safe_text(skill)}", body_style))

    # Improvements
    story.append(Paragraph("🚀 Recommended Improvements", heading_style))
    for i, improvement in enumerate(_safe_list(review_data.get("improvements", [])), 1):
        story.append(Paragraph(f"{i}. {_safe_text(improvement)}", body_style))

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
    story.append(Paragraph(f"Candidate: {_safe_text(user_name)} | Date: {datetime.now().strftime('%B %d, %Y')}", styles["Normal"]))
    story.append(HRFlowable(width="100%", thickness=2, color=primary_color, spaceAfter=10))

    # Scores
    story.append(Paragraph("📊 Performance Scores", heading_style))
    def _fmt(key):
        return f"{_safe_score(interview_data.get(key, 0)):.0f}/100"
    scores_data = [
        ["Category", "Score"],
        ["Overall Score", _fmt('overall_score')],
        ["Technical Knowledge", _fmt('technical_score')],
        ["Communication", _fmt('communication_score')],
        ["Confidence", _fmt('confidence_score')],
        ["Professionalism", _fmt('professionalism_score')],
        ["Grammar", _fmt('grammar_score')],
        ["Completeness", _fmt('completeness_score')],
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
    story.append(Paragraph(_safe_text(interview_data.get("ai_summary", "")), styles["Normal"]))

    # Strengths
    story.append(Paragraph("✅ Strengths", heading_style))
    for s in _safe_list(interview_data.get("strengths", [])):
        story.append(Paragraph(f"• {_safe_text(s)}", styles["Normal"]))

    # Improvements
    story.append(Paragraph("🎯 Areas to Improve", heading_style))
    for a in _safe_list(interview_data.get("areas_to_improve", [])):
        story.append(Paragraph(f"• {_safe_text(a)}", styles["Normal"]))

    # Suggestions
    story.append(Paragraph("💡 Suggestions", heading_style))
    for sg in _safe_list(interview_data.get("suggestions", [])):
        story.append(Paragraph(f"• {_safe_text(sg)}", styles["Normal"]))

    doc.build(story)
    return buffer.getvalue()
