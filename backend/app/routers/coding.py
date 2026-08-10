from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database.connection import get_db
from app.core.dependencies import get_current_user, get_current_admin
from app.models.user import User
from app.models.coding_question import CodingQuestion, CodingSubmission, SubmissionStatus, ProgrammingLanguage
from app.models.leaderboard import Leaderboard
from app.models.question import Difficulty
from app.schemas.coding import (
    CodingQuestionCreate, CodingQuestionResponse,
    CodeSubmitRequest, CodeRunRequest, CodeRunResponse, SubmissionResponse,
    HintRequest, TestCaseResult,
)
from app.utils.code_executor import execute_code
from app.utils.ai_client import generate_coding_hint
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/coding", tags=["Coding Challenges"])


@router.get("/", response_model=List[dict])
async def list_problems(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    difficulty: Optional[Difficulty] = None,
    category: Optional[str] = None,
    language: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List coding problems with filters."""
    query = db.query(CodingQuestion).filter(CodingQuestion.is_active == True)

    if difficulty:
        query = query.filter(CodingQuestion.difficulty == difficulty)
    if category:
        query = query.filter(CodingQuestion.category.ilike(f"%{category}%"))
    if search:
        query = query.filter(
            or_(
                CodingQuestion.title.ilike(f"%{search}%"),
                CodingQuestion.category.ilike(f"%{search}%"),
            )
        )

    total = query.count()
    problems = query.offset((page - 1) * per_page).limit(per_page).all()

    return [
        {
            "id": p.id,
            "title": p.title,
            "slug": p.slug,
            "difficulty": p.difficulty.value,
            "category": p.category,
            "tags": p.tags,
            "acceptance_rate": p.acceptance_rate,
            "total_submissions": p.total_submissions,
            "like_count": p.like_count,
        }
        for p in problems
    ]


@router.get("/categories")
async def get_categories():
    """Get available problem categories."""
    return [
        "Arrays", "Strings", "Dynamic Programming", "Graphs", "Trees",
        "Sorting", "Searching", "Recursion", "Backtracking", "Greedy",
        "Math", "Bit Manipulation", "Two Pointers", "Sliding Window",
        "Stack & Queue", "Linked Lists", "Hash Tables", "SQL", "System Design",
    ]


@router.get("/{problem_id}", response_model=dict)
async def get_problem(
    problem_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get full details of a coding problem."""
    problem = db.query(CodingQuestion).filter(
        CodingQuestion.id == problem_id,
        CodingQuestion.is_active == True,
    ).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    # Get only sample test cases for students
    sample_cases = [
        {"input": tc.input_data, "output": tc.expected_output, "explanation": tc.explanation}
        for tc in problem.test_cases
        if tc.is_sample
    ]

    return {
        "id": problem.id,
        "title": problem.title,
        "slug": problem.slug,
        "problem_statement": problem.problem_statement,
        "input_format": problem.input_format,
        "output_format": problem.output_format,
        "constraints": problem.constraints,
        "examples": problem.examples,
        "hints": problem.hints,
        "difficulty": problem.difficulty.value,
        "category": problem.category,
        "tags": problem.tags,
        "supported_languages": problem.supported_languages,
        "time_limit_ms": problem.time_limit_ms,
        "memory_limit_kb": problem.memory_limit_kb,
        "acceptance_rate": problem.acceptance_rate,
        "sample_test_cases": sample_cases,
    }


@router.post("/run", response_model=CodeRunResponse)
async def run_code(
    data: CodeRunRequest,
    current_user: User = Depends(get_current_user),
):
    """Run code against custom input (not graded)."""
    result = await execute_code(data.code, data.language.value, data.input_data)
    return CodeRunResponse(
        output=result.get("stdout", ""),
        error=result.get("stderr") or None,
        execution_time_ms=result.get("execution_time_ms"),
        memory_used_kb=result.get("memory_used_kb"),
    )


@router.post("/submit")
async def submit_solution(
    data: CodeSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit a solution and run against all test cases."""
    problem = db.query(CodingQuestion).filter(CodingQuestion.id == data.question_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    test_cases = problem.test_cases
    passed = 0
    total = len(test_cases)
    final_status = SubmissionStatus.ACCEPTED
    error_msg = None
    exec_time = 0
    memory_used = 0
    test_results = []

    for idx, tc in enumerate(test_cases):
        result = await execute_code(data.code, data.language.value, tc.input_data, tc.expected_output)
        tc_time = result.get("execution_time_ms", 0)
        exec_time = max(exec_time, tc_time)
        memory_used = max(memory_used, result.get("memory_used_kb", 0))

        status_str = result.get("status", "")
        actual_output = result.get("stdout", "").strip()
        tc_error = result.get("stderr", "") or None

        tc_passed = False
        if "Compilation" in status_str:
            if final_status == SubmissionStatus.ACCEPTED:
                final_status = SubmissionStatus.COMPILATION_ERROR
                error_msg = result.get("stderr", "Compilation Error")
            test_results.append(TestCaseResult(
                index=idx,
                passed=False,
                input_data=tc.input_data if tc.is_sample else "(hidden)",
                expected_output=tc.expected_output if tc.is_sample else "(hidden)",
                actual_output="",
                error=tc_error,
                execution_time_ms=tc_time,
                is_sample=tc.is_sample,
            ))
            break
        elif "Time Limit" in status_str:
            if final_status == SubmissionStatus.ACCEPTED:
                final_status = SubmissionStatus.TIME_LIMIT_EXCEEDED
                error_msg = "Time Limit Exceeded"
            test_results.append(TestCaseResult(
                index=idx,
                passed=False,
                input_data=tc.input_data if tc.is_sample else "(hidden)",
                expected_output=tc.expected_output if tc.is_sample else "(hidden)",
                actual_output="Time Limit Exceeded",
                error=None,
                execution_time_ms=tc_time,
                is_sample=tc.is_sample,
            ))
            break
        elif "Runtime" in status_str or (result.get("exit_code", 0) or 0) != 0:
            if final_status == SubmissionStatus.ACCEPTED:
                final_status = SubmissionStatus.RUNTIME_ERROR
                error_msg = result.get("stderr", "Runtime Error")
            test_results.append(TestCaseResult(
                index=idx,
                passed=False,
                input_data=tc.input_data if tc.is_sample else "(hidden)",
                expected_output=tc.expected_output if tc.is_sample else "(hidden)",
                actual_output=actual_output,
                error=tc_error,
                execution_time_ms=tc_time,
                is_sample=tc.is_sample,
            ))
        elif "Accepted" in status_str:
            tc_passed = True
            passed += 1
            test_results.append(TestCaseResult(
                index=idx,
                passed=True,
                input_data=tc.input_data if tc.is_sample else "(hidden)",
                expected_output=tc.expected_output if tc.is_sample else "(hidden)",
                actual_output=actual_output,
                error=None,
                execution_time_ms=tc_time,
                is_sample=tc.is_sample,
            ))
        else:
            # Wrong answer
            if final_status == SubmissionStatus.ACCEPTED:
                final_status = SubmissionStatus.WRONG_ANSWER
            test_results.append(TestCaseResult(
                index=idx,
                passed=False,
                input_data=tc.input_data if tc.is_sample else "(hidden)",
                expected_output=tc.expected_output if tc.is_sample else "(hidden)",
                actual_output=actual_output,
                error=None,
                execution_time_ms=tc_time,
                is_sample=tc.is_sample,
            ))

    if final_status == SubmissionStatus.ACCEPTED and passed < total:
        final_status = SubmissionStatus.WRONG_ANSWER

    score = (passed / total * 100) if total > 0 else 0

    submission = CodingSubmission(
        user_id=current_user.id,
        question_id=data.question_id,
        code=data.code,
        language=data.language,
        status=final_status,
        execution_time_ms=exec_time,
        memory_used_kb=memory_used,
        test_cases_passed=passed,
        total_test_cases=total,
        error_message=error_msg,
        score=score,
    )
    db.add(submission)

    # Update problem stats
    problem.total_submissions += 1
    accepted_count = db.query(CodingSubmission).filter(
        CodingSubmission.question_id == problem.id,
        CodingSubmission.status == SubmissionStatus.ACCEPTED,
    ).count()
    if problem.total_submissions > 0:
        problem.acceptance_rate = (accepted_count / problem.total_submissions) * 100

    # Update leaderboard if accepted
    if final_status == SubmissionStatus.ACCEPTED:
        lb = db.query(Leaderboard).filter(Leaderboard.user_id == current_user.id).first()
        if lb:
            lb.total_points += 10
            lb.weekly_points += 10
            lb.monthly_points += 10
            lb.coding_problems_solved += 1

    db.commit()
    db.refresh(submission)

    return {
        "id": submission.id,
        "question_id": submission.question_id,
        "status": submission.status.value,
        "execution_time_ms": submission.execution_time_ms,
        "memory_used_kb": submission.memory_used_kb,
        "test_cases_passed": submission.test_cases_passed,
        "total_test_cases": submission.total_test_cases,
        "error_message": submission.error_message,
        "score": submission.score,
        "submitted_at": submission.submitted_at.isoformat(),
        "test_results": [tr.model_dump() for tr in test_results],
    }


@router.post("/hint")
async def get_hint(
    data: HintRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get an AI-generated hint for a coding problem."""
    problem = db.query(CodingQuestion).filter(CodingQuestion.id == data.question_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    hint = await generate_coding_hint(
        problem.problem_statement,
        data.code,
        data.language.value,
        data.error_message,
    )
    return {"hint": hint}


@router.get("/submissions/me")
async def get_my_submissions(
    question_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current user's submissions."""
    query = db.query(CodingSubmission).filter(CodingSubmission.user_id == current_user.id)
    if question_id:
        query = query.filter(CodingSubmission.question_id == question_id)
    submissions = query.order_by(CodingSubmission.submitted_at.desc()).limit(50).all()
    return [
        {
            "id": s.id,
            "question_id": s.question_id,
            "language": s.language.value,
            "status": s.status.value,
            "test_cases_passed": s.test_cases_passed,
            "total_test_cases": s.total_test_cases,
            "execution_time_ms": s.execution_time_ms,
            "score": s.score,
            "submitted_at": s.submitted_at.isoformat(),
        }
        for s in submissions
    ]


@router.post("/", response_model=dict, status_code=201)
async def create_problem(
    data: CodingQuestionCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Admin: Create a new coding problem."""
    from app.models.coding_question import TestCase
    test_cases_data = data.test_cases
    problem_data = data.model_dump(exclude={"test_cases"})
    problem = CodingQuestion(**problem_data, created_by=admin.id)
    db.add(problem)
    db.flush()

    for tc in test_cases_data:
        test_case = TestCase(**tc.model_dump(), question_id=problem.id)
        db.add(test_case)

    db.commit()
    db.refresh(problem)
    return {"id": problem.id, "title": problem.title, "slug": problem.slug}
