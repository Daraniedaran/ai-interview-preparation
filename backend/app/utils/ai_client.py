import logging
from typing import Optional, List, Dict, Any
from openai import AsyncOpenAI
from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize OpenAI client (lazy — only if key is configured)
_client: Optional[AsyncOpenAI] = None


def get_openai_client() -> Optional[AsyncOpenAI]:
    """Get the OpenAI client singleton."""
    global _client
    if not settings.OPENAI_API_KEY:
        logger.warning("OpenAI API key not configured")
        return None
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


async def analyze_resume(resume_text: str) -> Dict[str, Any]:
    """
    Analyze a resume using OpenAI and return structured feedback.
    Falls back to a deterministic content-aware local analyzer when
    OpenAI is not configured, so every resume gets a different result.
    """
    client = get_openai_client()
    if not client:
        logger.info("OPENAI_API_KEY missing — using local resume analyzer")
        return _local_resume_analysis(resume_text)

    prompt = f"""Analyze this resume and provide detailed feedback in JSON format.

RESUME TEXT:
{resume_text[:4000]}

Respond with a valid JSON object containing:
{{
  "resume_score": <0-100 overall score>,
  "ats_score": <0-100 ATS compatibility score>,
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...],
  "missing_skills": ["skill1", "skill2", ...],
  "grammar_suggestions": ["fix1", "fix2", ...],
  "improvements": ["improvement1", "improvement2", ...],
  "keyword_analysis": {{
    "found": ["keyword1", ...],
    "missing": ["keyword1", ...]
  }},
  "section_scores": {{
    "contact_info": <0-100>,
    "summary": <0-100>,
    "education": <0-100>,
    "experience": <0-100>,
    "skills": <0-100>,
    "projects": <0-100>
  }},
  "ai_feedback": "Detailed narrative feedback paragraph..."
}}"""

    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=2000,
        )
        import json
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        logger.error(f"OpenAI resume analysis error: {e}")
        return _local_resume_analysis(resume_text)


async def generate_interview_question(
    interview_type: str,
    target_role: str,
    company_name: Optional[str],
    difficulty: str,
    question_number: int,
    previous_questions: List[str],
) -> str:
    """Generate the next interview question."""
    client = get_openai_client()
    if not client:
        return _mock_interview_question(interview_type, question_number)

    prev_q_text = "\n".join([f"- {q}" for q in previous_questions[-3:]]) if previous_questions else "None yet"
    company_context = f"for {company_name}" if company_name else ""

    prompt = f"""You are an interviewer {company_context} conducting a {interview_type} interview for a {target_role} position.
Difficulty: {difficulty}
Question #{question_number}

Previous questions asked:
{prev_q_text}

Generate ONE new interview question that:
1. Is appropriate for the interview type ({interview_type})
2. Is different from previous questions
3. Matches the {difficulty} difficulty level
4. Is clear and specific

Respond with ONLY the question text, no numbering or extra text."""

    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"OpenAI question generation error: {e}")
        return _mock_interview_question(interview_type, question_number)


async def evaluate_interview_answer(
    question: str,
    answer: str,
    interview_type: str,
    target_role: str,
) -> Dict[str, Any]:
    """Evaluate a student's interview answer using AI."""
    client = get_openai_client()
    if not client:
        return _mock_answer_evaluation()

    prompt = f"""Evaluate this interview answer for a {target_role} position.

Question: {question}
Answer: {answer}
Interview Type: {interview_type}

Provide evaluation as JSON:
{{
  "score": <0-10>,
  "ai_feedback": "Detailed feedback on the answer...",
  "ideal_answer": "What an ideal answer would include...",
  "keywords_used": ["keyword1", ...],
  "keywords_missed": ["keyword1", ...]
}}"""

    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=1000,
        )
        import json
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        logger.error(f"OpenAI answer evaluation error: {e}")
        return _mock_answer_evaluation()


async def generate_interview_summary(
    interview_type: str,
    target_role: str,
    responses: List[Dict],
) -> Dict[str, Any]:
    """Generate overall interview report summary."""
    client = get_openai_client()
    if not client:
        return _mock_interview_summary()

    qa_text = "\n\n".join([
        f"Q: {r['question']}\nA: {r['answer']}\nScore: {r.get('score', 'N/A')}"
        for r in responses[:10]
    ])

    prompt = f"""Generate an overall interview performance summary.

Interview Type: {interview_type}
Role: {target_role}
Q&A:
{qa_text}

Respond as JSON:
{{
  "overall_score": <0-100>,
  "confidence_score": <0-100>,
  "communication_score": <0-100>,
  "technical_score": <0-100>,
  "professionalism_score": <0-100>,
  "grammar_score": <0-100>,
  "completeness_score": <0-100>,
  "ai_summary": "Overall performance summary paragraph...",
  "suggestions": ["suggestion1", "suggestion2", ...],
  "strengths": ["strength1", ...],
  "areas_to_improve": ["area1", ...]
}}"""

    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=1500,
        )
        import json
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        logger.error(f"OpenAI summary generation error: {e}")
        return _mock_interview_summary()


async def generate_coding_hint(
    problem: str,
    code: str,
    language: str,
    error: Optional[str],
) -> str:
    """Generate a hint for a coding problem without giving away the solution."""
    client = get_openai_client()
    if not client:
        return "Try breaking the problem into smaller sub-problems and think about edge cases."

    prompt = f"""Student is stuck on a coding problem. Provide a helpful hint WITHOUT giving the solution.

Problem: {problem[:500]}
Language: {language}
Student's code so far:
```
{code[:1000]}
```
Error (if any): {error or 'None'}

Give a concise, helpful hint (2-3 sentences max) that guides them in the right direction."""

    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"OpenAI hint generation error: {e}")
        return "Consider the time complexity of your approach and look for optimization opportunities."


# ===== Content-aware local analyzer (used when OpenAI is not configured) =====

_SKILLS_TAXONOMY = [
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust",
    "React", "Angular", "Vue", "Next.js", "Node.js", "HTML", "CSS",
    "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis",
    "Docker", "Kubernetes", "AWS", "GCP", "Azure", "CI/CD", "Git", "Linux",
    "REST API", "GraphQL", "Microservices", "Agile", "System Design",
    "Machine Learning", "Data Analysis", "TensorFlow", "PyTorch",
    "Pandas", "NumPy", "Excel", "Figma", "Postman",
]

_IN_DEMAND_SKILLS = [
    "Docker", "Kubernetes", "AWS", "CI/CD", "System Design",
    "REST API", "Microservices", "Agile", "Git", "SQL",
    "React", "Python", "Machine Learning", "Data Analysis",
]

_ACTION_VERBS = [
    "built", "developed", "led", "designed", "implemented", "optimized",
    "automated", "launched", "created", "managed", "improved", "increased",
    "reduced", "delivered", "collaborated", "architected", "deployed",
    "mentored", "spearheaded", "engineered",
]

_DEGREE_KEYWORDS = [
    "bachelor", "master", "b.tech", "m.tech", "b.e", "m.e", "bca", "mca",
    "phd", "mba", "university", "college", "institute", "cgpa", "gpa",
]


def _clamp(v: float, lo: float = 0, hi: float = 100) -> int:
    return int(max(lo, min(hi, round(v))))


def _has_header(lower: str, keywords: list) -> bool:
    import re
    for kw in keywords:
        if re.search(rf"(?im)^[^\n]{{0,40}}\b{re.escape(kw)}\b", lower):
            return True
    return False


def _local_resume_analysis(resume_text: str) -> Dict[str, Any]:
    """Deterministic, content-aware resume analysis. Different text -> different scores."""
    import re

    text = resume_text or ""
    lower = text.lower()
    words = text.split()
    word_count = len(words)
    lines = [l.strip() for l in text.splitlines() if l.strip()]

    # --- contact signals ---
    has_email = bool(re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", text))
    has_phone = bool(re.search(r"(\+?\d[\d\s\-()]{7,}\d)", text))
    has_linkedin = "linkedin" in lower
    has_github = "github" in lower
    has_portfolio = bool(re.search(r"(portfolio|personal website|behance|leetcode|hackerrank)", lower))

    contact_score = 10
    if has_email:
        contact_score += 25
    if has_phone:
        contact_score += 20
    if has_linkedin:
        contact_score += 20
    if has_github:
        contact_score += 15
    if has_portfolio:
        contact_score += 10
    contact_score = _clamp(contact_score)

    # --- skills ---
    found_skills = [s for s in _SKILLS_TAXONOMY if s.lower() in lower]
    # de-dupe while preserving order
    seen = set()
    uniq_found = []
    for s in found_skills:
        k = s.lower()
        if k not in seen:
            seen.add(k)
            uniq_found.append(s)
    found_skills = uniq_found
    n_skills = len(found_skills)
    has_skills_header = _has_header(lower, ["skills", "technical skills", "tech stack", "competencies"])

    if n_skills == 0:
        skills_score = 25
    elif n_skills <= 2:
        skills_score = 45
    elif n_skills <= 5:
        skills_score = 65
    elif n_skills <= 9:
        skills_score = 80
    else:
        skills_score = 92
    if has_skills_header:
        skills_score = _clamp(skills_score + 5)
    if word_count < 120:
        skills_score = _clamp(skills_score - 10)

    # --- summary ---
    has_summary_header = _has_header(lower, ["summary", "objective", "profile", "about me"])
    intro_chunk = " ".join(words[:120])
    if has_summary_header:
        summary_len = len(intro_chunk.split())
        skills_score_bonus = min(20, summary_len // 4)
        summary_score = _clamp(72 + skills_score_bonus)
    else:
        if word_count > 350:
            summary_score = 48
        elif word_count > 200:
            summary_score = 38
        else:
            summary_score = 25

    # --- education ---
    has_edu_header = _has_header(lower, ["education", "academic", "qualification"])
    edu_hits = sum(1 for k in _DEGREE_KEYWORDS if k in lower)
    if has_edu_header:
        education_score = _clamp(68 + edu_hits * 5 + (8 if re.search(r"\b(gpa|cgpa|honors|distinction|first class)\b", lower) else 0))
    else:
        education_score = _clamp(22 + edu_hits * 8)

    # --- bullets / metrics / verbs ---
    bullet_re = re.compile(r"^\s*(?:•|-|–|\*|·|\d+\.|\(\d+\)|▪|◦|>)")
    n_bullets = sum(1 for l in lines if bullet_re.match(l))
    metric_hits = len(re.findall(r"\d+\s*%|\d+\+|\$\s*\d|\b\d{3,}\b", text))
    impact_words = len(re.findall(r"\b(increased|improved|reduced|decreased|grew|growth|saved|cut|boosted|achieved|delivered|launched|serving|users|requests|revenue|cost)\b", lower))
    n_metrics = metric_hits + impact_words
    n_verbs = sum(1 for v in _ACTION_VERBS if v in lower)

    # --- experience ---
    has_exp_header = _has_header(lower, ["experience", "work history", "employment", "work experience", "internship", "intern"])
    if has_exp_header:
        experience_score = 52 + min(18, n_metrics * 3) + min(15, n_verbs * 2) + min(10, n_bullets)
    elif n_verbs >= 4 or n_bullets >= 4:
        experience_score = 42 + min(12, n_metrics * 2) + min(8, n_verbs)
    else:
        experience_score = _clamp(20 + n_verbs * 4 + n_bullets * 2 + n_metrics * 2)
    experience_score = _clamp(experience_score)

    # --- projects ---
    has_proj_header = _has_header(lower, ["projects", "personal projects", "academic projects", "portfolio"])
    proj_keywords = sum(1 for k in ["built", "developed", "github.com", "live demo", "deployed", "tech stack"] if k in lower)
    if has_proj_header:
        projects_score = _clamp(58 + proj_keywords * 6 + min(12, n_metrics * 2) + (8 if has_github else 0))
    elif proj_keywords >= 2 or has_github:
        projects_score = _clamp(42 + proj_keywords * 5)
    else:
        projects_score = _clamp(22 + proj_keywords * 4 + (5 if word_count > 300 else 0))

    # --- overall + ATS ---
    resume_score = _clamp(
        contact_score * 0.10
        + summary_score * 0.10
        + education_score * 0.15
        + experience_score * 0.30
        + skills_score * 0.20
        + projects_score * 0.15
    )
    n_headers = sum([has_summary_header, has_edu_header, has_exp_header, has_skills_header, has_proj_header])
    ats_score = _clamp(
        (15 if word_count >= 150 else 5)
        + (contact_score / 100) * 20
        + (n_headers / 5) * 20
        + min(20, n_skills * 2.5)
        + min(10, n_bullets)
        + min(15, n_metrics * 2 + n_verbs)
    )

    # --- missing skills ---
    found_lower = {s.lower() for s in found_skills}
    missing_skills = [s for s in _IN_DEMAND_SKILLS if s.lower() not in found_lower][:5]
    if n_skills >= 10:
        missing_skills = missing_skills[:3]

    # --- strengths (content-specific) ---
    strengths = []
    if contact_score >= 75:
        parts = []
        if has_email:
            parts.append("email")
        if has_phone:
            parts.append("phone")
        if has_linkedin:
            parts.append("LinkedIn")
        if has_github:
            parts.append("GitHub")
        strengths.append(f"Complete contact information ({', '.join(parts)})")
    if n_skills >= 6:
        strengths.append(f"Strong technical coverage with {n_skills} skills detected ({', '.join(found_skills[:4])})")
    elif n_skills >= 3:
        strengths.append(f"Relevant skills listed ({', '.join(found_skills[:3])})")
    if n_metrics >= 4:
        strengths.append(f"Good use of quantifiable impact ({n_metrics} metrics/impact signals found)")
    if n_bullets >= 5:
        strengths.append(f"Well-structured with {n_bullets} bullet points")
    if experience_score >= 70:
        strengths.append("Clear experience section with action verbs and detail")
    if education_score >= 70:
        strengths.append("Solid education background presented")
    if projects_score >= 70:
        strengths.append("Good project showcase with technical detail")
    if word_count >= 300 and len(strengths) < 2:
        strengths.append(f"Good resume depth ({word_count} words with detail)")
    while len(strengths) < 2:
        if has_email:
            strengths.append("Contact email present and parseable")
            break
        strengths.append(f"Resume parsed successfully ({word_count} words)")
        break
    strengths = strengths[:4]

    # --- weaknesses ---
    weaknesses = []
    if summary_score < 60:
        weaknesses.append("Missing or weak professional summary/objective section")
    if n_metrics < 3:
        weaknesses.append(f"Lacks quantifiable achievements (only {n_metrics} metrics/impact signals detected)")
    if projects_score < 60:
        weaknesses.append("Limited project descriptions or missing project links")
    if n_skills < 4:
        weaknesses.append(f"Thin skills section (only {n_skills} recognized technical keywords)")
    if not has_linkedin:
        weaknesses.append("No LinkedIn profile link detected")
    if not has_github and projects_score < 70:
        weaknesses.append("No GitHub/portfolio link to verify work")
    if n_bullets < 4:
        weaknesses.append("Few bullet points — experience reads as blocks of text")
    if education_score < 60:
        weaknesses.append("Education section unclear or missing standard details")
    if word_count < 150:
        weaknesses.append(f"Resume looks too short ({word_count} words) — likely missing detail")
    if word_count > 900:
        weaknesses.append(f"Resume is long ({word_count} words) — consider conciseness for ATS")
    weaknesses = weaknesses[:4] or ["Could add more role-specific keywords for ATS"]

    # --- grammar suggestions ---
    grammar_suggestions = []
    if "responsible for" in lower:
        grammar_suggestions.append("Replace 'responsible for' with strong action verbs (e.g. 'Led', 'Built', 'Delivered')")
    avg_sent_len = word_count / max(1, len(re.split(r"[.!?]+", text)))
    if avg_sent_len > 28:
        grammar_suggestions.append(f"Sentences are long (avg ~{avg_sent_len:.0f} words) — split into concise bullets")
    if "etc." in lower:
        grammar_suggestions.append("Avoid 'etc.' — list the exact skills/tools instead")
    if re.search(r"\b(was|were)\b.{0,20}\bby\b", lower):
        grammar_suggestions.append("Avoid passive voice ('was ... by') — use active voice")
    if re.search(r"\bi\s+(am|have|worked|did)\b", text):
        grammar_suggestions.append("Avoid first-person 'I' in bullets — start with verbs")
    if len(grammar_suggestions) < 2:
        grammar_suggestions.append("Use consistent past tense for past roles, present tense for current role")
    if n_bullets >= 1 and len(grammar_suggestions) < 3 and n_metrics < 3:
        grammar_suggestions.append("Start each bullet with an action verb + metric (e.g. 'Improved X by 30%')")
    grammar_suggestions = grammar_suggestions[:3]

    # --- improvements ---
    improvements = []
    if summary_score < 60:
        improvements.append("Add a 2-3 line professional summary with role, years of experience, and top skills")
    if n_metrics < 3:
        improvements.append("Add quantifiable metrics to experience (e.g. 'Improved performance by 30%', 'Served 10k users')")
    if missing_skills:
        improvements.append(f"Add in-demand keywords relevant to your target role: {', '.join(missing_skills[:3])}")
    if not has_linkedin or not has_github:
        missing_links = [x for x, ok in [("LinkedIn", has_linkedin), ("GitHub", has_github)] if not ok]
        improvements.append(f"Add {' and '.join(missing_links)} links to the header for credibility")
    if projects_score < 65:
        improvements.append("Expand projects with tech stack, your role, outcome, and live/GitHub links")
    if n_headers < 4:
        improvements.append("Use standard ATS headers: Summary, Skills, Experience, Education, Projects")
    improvements = improvements[:5] or ["Tailor keywords to each job description before applying"]

    # --- narrative feedback (unique per resume) ---
    top_skills_txt = ", ".join(found_skills[:4]) if found_skills else "few detectable technical keywords"
    weak_txt = "; ".join(weaknesses[:2]).lower()
    feedback = (
        f"This resume is {word_count} words with {n_skills} recognized technical skills ({top_skills_txt}), "
        f"{n_bullets} bullet points and {n_metrics} quantifiable/impact signals. "
        f"Overall {resume_score}/100 (ATS {ats_score}/100). "
        f"Strongest areas: {'; '.join(strengths[:2]).lower()}. "
        f"Main gaps: {weak_txt}. "
        f"Highest-impact next step: {improvements[0].lower() if improvements else 'tailor it to the target role'}."
    )

    return {
        "resume_score": resume_score,
        "ats_score": ats_score,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "missing_skills": missing_skills,
        "grammar_suggestions": grammar_suggestions,
        "improvements": improvements,
        "keyword_analysis": {"found": found_skills, "missing": missing_skills},
        "section_scores": {
            "contact_info": contact_score,
            "summary": summary_score,
            "education": education_score,
            "experience": experience_score,
            "skills": skills_score,
            "projects": projects_score,
        },
        "ai_feedback": feedback,
    }


def _mock_resume_analysis() -> Dict[str, Any]:
    return {
        "resume_score": 72,
        "ats_score": 68,
        "strengths": ["Good education section", "Relevant technical skills listed", "Clear formatting"],
        "weaknesses": ["Missing quantifiable achievements", "No summary/objective section", "Limited project descriptions"],
        "missing_skills": ["Docker", "Kubernetes", "System Design", "Cloud (AWS/GCP)"],
        "grammar_suggestions": ["Use consistent tense throughout", "Avoid passive voice"],
        "improvements": [
            "Add quantifiable metrics to experience (e.g., 'Improved performance by 30%')",
            "Include a professional summary at the top",
            "Add more technical keywords relevant to your target role",
        ],
        "keyword_analysis": {
            "found": ["Python", "JavaScript", "React", "SQL"],
            "missing": ["CI/CD", "Agile", "REST API", "Microservices"],
        },
        "section_scores": {
            "contact_info": 90,
            "summary": 40,
            "education": 85,
            "experience": 65,
            "skills": 75,
            "projects": 60,
        },
        "ai_feedback": "Your resume shows a solid technical foundation, particularly in programming languages and frameworks. However, to stand out in today's competitive market, focus on adding measurable achievements to your experience section. Recruiters and ATS systems look for quantifiable impact — for example, 'Built REST API serving 10,000 daily requests' rather than 'Built REST API'. Additionally, a professional summary at the top would immediately communicate your value proposition to recruiters.",
    }


def _mock_interview_question(interview_type: str, question_number: int) -> str:
    questions = {
        "technical": [
            "Explain the difference between a stack and a queue. When would you use each?",
            "What is the time complexity of binary search and why?",
            "Describe how you would design a URL shortener like bit.ly.",
            "What are the SOLID principles in object-oriented programming?",
            "Explain the difference between REST and GraphQL APIs.",
        ],
        "behavioral": [
            "Tell me about a time you had to work under tight deadlines. How did you handle it?",
            "Describe a situation where you had a conflict with a team member. How did you resolve it?",
            "Tell me about your most challenging project and what you learned from it.",
            "Describe a time when you had to quickly learn a new technology.",
            "What is your greatest professional achievement so far?",
        ],
        "hr": [
            "Tell me about yourself and your background.",
            "Why are you interested in this role and company?",
            "Where do you see yourself in 5 years?",
            "What is your expected compensation?",
            "Do you have any questions for us?",
        ],
    }
    q_list = questions.get(interview_type, questions["technical"])
    return q_list[(question_number - 1) % len(q_list)]


def _mock_answer_evaluation() -> Dict[str, Any]:
    return {
        "score": 7.0,
        "ai_feedback": "Good answer! You covered the key concepts well. Consider adding specific examples from your experience to strengthen your response.",
        "ideal_answer": "An ideal answer would include specific examples, relevant metrics, and demonstrate deep understanding of the underlying concepts.",
        "keywords_used": ["efficient", "scalable", "implementation"],
        "keywords_missed": ["trade-offs", "real-world application", "performance metrics"],
    }


def _mock_interview_summary() -> Dict[str, Any]:
    return {
        "overall_score": 72,
        "confidence_score": 75,
        "communication_score": 70,
        "technical_score": 73,
        "professionalism_score": 80,
        "grammar_score": 85,
        "completeness_score": 65,
        "ai_summary": "You demonstrated a good understanding of technical concepts and communicated clearly. Your answers were structured and professional. Focus on providing more specific examples and quantifiable results to strengthen your responses.",
        "suggestions": [
            "Use the STAR method (Situation, Task, Action, Result) for behavioral questions",
            "Practice explaining technical concepts with real-world analogies",
            "Prepare 2-3 specific project examples to reference in answers",
        ],
        "strengths": ["Clear communication", "Good technical knowledge", "Professional tone"],
        "areas_to_improve": ["Add more specific examples", "Improve depth on system design", "Work on confidence"],
    }
