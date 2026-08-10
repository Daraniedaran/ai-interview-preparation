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
    Returns mock data if OpenAI is not configured.
    """
    client = get_openai_client()
    if not client:
        return _mock_resume_analysis()

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
        return _mock_resume_analysis()


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


# ===== Mock responses when OpenAI is not configured =====

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
