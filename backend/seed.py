"""
Database seeder — Run this after migrations to populate sample data.
Usage: python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.connection import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.models.student_profile import StudentProfile, Skill, Education
from app.models.company import Company, InterviewRound
from app.models.question import Question, QuestionCategory, Difficulty, QuestionType
from app.models.coding_question import CodingQuestion, TestCase
from app.models.aptitude_test import AptitudeTest
from app.models.achievement import Achievement
from app.models.leaderboard import Leaderboard
from app.core.security import get_password_hash
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def seed_all():
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        seed_users(db)
        seed_companies(db)
        seed_questions(db)
        seed_coding_questions(db)
        seed_aptitude_tests(db)
        seed_achievements(db)
        logger.info("✅ Seeding complete!")
    except Exception as e:
        logger.error(f"Seeding failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def seed_users(db):
    if db.query(User).count() > 0:
        logger.info("Users already seeded — skipping")
        return

    logger.info("Seeding users...")

    # Admin
    admin = User(
        email="admin@aiinterview.com",
        username="admin",
        hashed_password=get_password_hash("Admin@123"),
        full_name="Platform Admin",
        role=UserRole.ADMIN,
        is_active=True,
        is_verified=True,
    )
    db.add(admin)
    db.flush()

    # Students
    students_data = [
        ("alice@example.com", "alice_dev", "Alice Johnson", "IIT Bombay", 2025),
        ("bob@example.com", "bob_coder", "Bob Smith", "NIT Trichy", 2024),
        ("charlie@example.com", "charlie_cs", "Charlie Kumar", "BITS Pilani", 2025),
        ("diana@example.com", "diana_tech", "Diana Patel", "VIT Chennai", 2026),
        ("evan@example.com", "evan_algo", "Evan Zhang", "IIT Delhi", 2024),
    ]

    for email, username, full_name, college, grad_year in students_data:
        student = User(
            email=email,
            username=username,
            hashed_password=get_password_hash("Student@123"),
            full_name=full_name,
            role=UserRole.STUDENT,
            is_active=True,
            is_verified=True,
            college=college,
            graduation_year=grad_year,
        )
        db.add(student)
        db.flush()

        profile = StudentProfile(
            user_id=student.id,
            bio=f"Passionate software engineer and competitive programmer.",
            total_points=100 * (students_data.index((email, username, full_name, college, grad_year)) + 1),
            coding_score=65.0,
            aptitude_score=70.0,
            interview_score=60.0,
            streak_days=7,
        )
        db.add(profile)
        db.flush()

        edu = Education(
            profile_id=profile.id,
            institution=college,
            degree="B.Tech",
            field_of_study="Computer Science",
            grade="8.5 CGPA",
        )
        db.add(edu)

        for skill_name in ["Python", "JavaScript", "Data Structures", "Algorithms"]:
            skill = Skill(
                profile_id=profile.id,
                name=skill_name,
                category="Programming",
                proficiency="Intermediate",
            )
            db.add(skill)

        lb = Leaderboard(
            user_id=student.id,
            total_points=100 * (students_data.index((email, username, full_name, college, grad_year)) + 1),
            questions_solved=20,
            coding_problems_solved=10,
            tests_taken=5,
            streak_days=7,
        )
        db.add(lb)

    db.commit()
    logger.info(f"✅ Users seeded (1 admin + {len(students_data)} students)")


def seed_companies(db):
    if db.query(Company).count() > 0:
        logger.info("Companies already seeded — skipping")
        return

    logger.info("Seeding companies...")
    companies = [
        {
            "name": "Google",
            "slug": "google",
            "industry": "Technology",
            "headquarters": "Mountain View, CA",
            "description": "Google LLC is an American multinational technology company focusing on artificial intelligence, online advertising, search engine technology, cloud computing, computer software, quantum computing, e-commerce, and consumer electronics.",
            "interview_process": "Google's interview process typically involves 4-6 rounds including an initial phone screen, followed by technical interviews focusing on data structures, algorithms, and system design. Behavioral questions (Googleyness) are assessed throughout.",
            "difficulty": "Hard",
            "avg_salary": "$180,000 - $350,000",
            "employee_count": "180,000+",
            "glassdoor_rating": 4.3,
            "preparation_tips": [
                "Master Data Structures & Algorithms thoroughly",
                "Practice 200+ LeetCode problems (focus on Medium/Hard)",
                "Study system design concepts deeply",
                "Prepare for behavioral questions using STAR method",
                "Review Google's engineering blog posts",
            ],
            "frequently_asked_topics": ["Arrays", "Trees", "Dynamic Programming", "System Design", "Graphs"],
            "is_featured": True,
            "rounds": [
                {"round_number": 1, "round_name": "Online Assessment", "description": "2-3 coding problems on Google's platform", "duration_minutes": 90, "tips": ["Focus on optimal solutions", "Test edge cases"]},
                {"round_number": 2, "round_name": "Phone Screen", "description": "Technical interview with Google engineer", "duration_minutes": 60, "tips": ["Communicate your thought process", "Ask clarifying questions"]},
                {"round_number": 3, "round_name": "Onsite — Technical 1", "description": "Coding and algorithms", "duration_minutes": 45},
                {"round_number": 4, "round_name": "Onsite — Technical 2", "description": "System design", "duration_minutes": 45},
                {"round_number": 5, "round_name": "Onsite — Googleyness", "description": "Behavioral and culture fit", "duration_minutes": 45},
            ],
        },
        {
            "name": "Microsoft",
            "slug": "microsoft",
            "industry": "Technology",
            "headquarters": "Redmond, WA",
            "description": "Microsoft Corporation is an American multinational technology corporation which produces computer software, consumer electronics, personal computers, and related services.",
            "interview_process": "Microsoft's interview process includes 4-5 rounds of technical and behavioral interviews. They focus heavily on coding ability, problem-solving, and cultural fit (growth mindset).",
            "difficulty": "Hard",
            "avg_salary": "$160,000 - $300,000",
            "employee_count": "220,000+",
            "glassdoor_rating": 4.2,
            "preparation_tips": [
                "Focus on Object-Oriented Design principles",
                "Practice coding problems on LeetCode",
                "Understand Azure cloud services",
                "Prepare behavioral examples showing growth mindset",
            ],
            "frequently_asked_topics": ["OOP Design", "Arrays", "Strings", "Trees", "System Design"],
            "is_featured": True,
            "rounds": [
                {"round_number": 1, "round_name": "Online Assessment", "description": "2 coding problems", "duration_minutes": 60},
                {"round_number": 2, "round_name": "Technical Round 1", "description": "DS & Algorithms", "duration_minutes": 60},
                {"round_number": 3, "round_name": "Technical Round 2", "description": "OOP & Design", "duration_minutes": 60},
                {"round_number": 4, "round_name": "Behavioral Round", "description": "Values and culture fit", "duration_minutes": 45},
            ],
        },
        {
            "name": "Amazon",
            "slug": "amazon",
            "industry": "Technology / E-commerce",
            "headquarters": "Seattle, WA",
            "description": "Amazon.com, Inc. is an American multinational technology company focusing on e-commerce, cloud computing, online advertising, digital streaming, and artificial intelligence.",
            "interview_process": "Amazon uses the 'bar raiser' concept. Interviews heavily focus on Leadership Principles using the STAR method. Technical rounds cover coding and system design.",
            "difficulty": "Hard",
            "avg_salary": "$150,000 - $280,000",
            "employee_count": "1,500,000+",
            "glassdoor_rating": 3.9,
            "preparation_tips": [
                "Memorize all 16 Amazon Leadership Principles",
                "Prepare 2-3 STAR stories for each principle",
                "Study system design at scale",
                "Practice coding on LeetCode",
            ],
            "frequently_asked_topics": ["Leadership Principles", "System Design", "Scalability", "Arrays", "Trees"],
            "is_featured": True,
            "rounds": [
                {"round_number": 1, "round_name": "Online Assessment", "description": "Coding + Work simulation", "duration_minutes": 120},
                {"round_number": 2, "round_name": "Phone Screen", "description": "Technical + LP questions", "duration_minutes": 60},
                {"round_number": 3, "round_name": "Loop Interview 1", "description": "Coding", "duration_minutes": 60},
                {"round_number": 4, "round_name": "Loop Interview 2", "description": "System Design", "duration_minutes": 60},
                {"round_number": 5, "round_name": "Bar Raiser", "description": "Deep behavioral assessment", "duration_minutes": 60},
            ],
        },
        {
            "name": "Meta",
            "slug": "meta",
            "industry": "Social Media / Technology",
            "headquarters": "Menlo Park, CA",
            "description": "Meta Platforms, Inc. is an American multinational technology conglomerate that owns and operates Facebook, Instagram, Threads, WhatsApp, and other products and services.",
            "interview_process": "Meta focuses on coding ability and culture fit ('Move fast and break things' mentality). They have a heavy emphasis on product thinking alongside technical skills.",
            "difficulty": "Hard",
            "avg_salary": "$175,000 - $380,000",
            "employee_count": "87,000+",
            "glassdoor_rating": 4.0,
            "preparation_tips": [
                "Focus on dynamic programming and graph problems",
                "Study Meta's product design principles",
                "Practice system design for social media scale",
                "Understand Meta's core values",
            ],
            "frequently_asked_topics": ["Dynamic Programming", "Graphs", "System Design", "Product Design"],
            "is_featured": True,
            "rounds": [
                {"round_number": 1, "round_name": "Technical Screen", "description": "Coding interview", "duration_minutes": 45},
                {"round_number": 2, "round_name": "Coding Round 1", "description": "Algorithm problems", "duration_minutes": 60},
                {"round_number": 3, "round_name": "Coding Round 2", "description": "Algorithm problems", "duration_minutes": 60},
                {"round_number": 4, "round_name": "System Design", "description": "Large scale system design", "duration_minutes": 60},
                {"round_number": 5, "round_name": "Behavioral", "description": "Culture and values", "duration_minutes": 45},
            ],
        },
        {
            "name": "TCS",
            "slug": "tcs",
            "industry": "IT Services",
            "headquarters": "Mumbai, India",
            "description": "Tata Consultancy Services (TCS) is an Indian multinational information technology services and consulting company.",
            "interview_process": "TCS interviews include Online Assessment (Cognitive Skills + Coding), Technical Interview, Managerial Round, and HR Interview.",
            "difficulty": "Easy",
            "avg_salary": "₹3.5 - ₹10 LPA",
            "employee_count": "600,000+",
            "glassdoor_rating": 3.8,
            "preparation_tips": [
                "Practice aptitude questions from previous TCS papers",
                "Focus on basic programming concepts",
                "Know your resume projects well",
                "Prepare common HR questions",
            ],
            "frequently_asked_topics": ["Aptitude", "Basic Programming", "DBMS", "OOP", "Networking"],
            "is_featured": True,
            "rounds": [
                {"round_number": 1, "round_name": "Online Assessment", "description": "Cognitive + Coding + Email Writing", "duration_minutes": 90},
                {"round_number": 2, "round_name": "Technical Interview", "description": "CS fundamentals and projects", "duration_minutes": 30},
                {"round_number": 3, "round_name": "Managerial Round", "description": "Situational and project discussion", "duration_minutes": 20},
                {"round_number": 4, "round_name": "HR Interview", "description": "Background and fit", "duration_minutes": 15},
            ],
        },
        {
            "name": "Infosys",
            "slug": "infosys",
            "industry": "IT Services",
            "headquarters": "Bengaluru, India",
            "description": "Infosys Limited is an Indian multinational information technology company that provides business consulting, information technology and outsourcing services.",
            "interview_process": "Infosys InfyTQ exam followed by technical and HR interviews. Focus on aptitude, reasoning, and basic programming.",
            "difficulty": "Easy",
            "avg_salary": "₹3.6 - ₹9 LPA",
            "employee_count": "340,000+",
            "glassdoor_rating": 3.7,
            "preparation_tips": [
                "Register on InfyTQ platform and practice",
                "Brush up on basic data structures",
                "Prepare with previous year aptitude papers",
                "Focus on verbal and reasoning ability",
            ],
            "frequently_asked_topics": ["Aptitude", "Verbal Ability", "Logical Reasoning", "Basic Coding"],
            "is_featured": False,
            "rounds": [
                {"round_number": 1, "round_name": "InfyTQ Exam", "description": "Online assessment platform", "duration_minutes": 120},
                {"round_number": 2, "round_name": "Technical Interview", "description": "CS concepts and projects", "duration_minutes": 30},
                {"round_number": 3, "round_name": "HR Interview", "description": "Background and fit", "duration_minutes": 20},
            ],
        },
        {
            "name": "Wipro",
            "slug": "wipro",
            "industry": "IT Services",
            "headquarters": "Bengaluru, India",
            "description": "Wipro Limited is an Indian multinational corporation that provides information technology, consulting and business process services.",
            "interview_process": "Wipro NLTH exam + coding + technical + HR. Recent process is more technical-focused.",
            "difficulty": "Easy",
            "avg_salary": "₹3.5 - ₹8 LPA",
            "employee_count": "250,000+",
            "glassdoor_rating": 3.6,
            "preparation_tips": [
                "Practice NLTH-style aptitude questions",
                "Focus on time management in the online test",
                "Prepare basic programming questions",
            ],
            "frequently_asked_topics": ["Aptitude", "Coding", "Data Structures", "OOP"],
            "is_featured": False,
            "rounds": [
                {"round_number": 1, "round_name": "Online Test (NLTH)", "description": "Aptitude + Coding", "duration_minutes": 150},
                {"round_number": 2, "round_name": "Technical Interview", "description": "DS, Algorithms, Projects", "duration_minutes": 45},
                {"round_number": 3, "round_name": "HR Interview", "description": "Communication and background", "duration_minutes": 20},
            ],
        },
        {
            "name": "Zoho",
            "slug": "zoho",
            "industry": "SaaS / Technology",
            "headquarters": "Chennai, India",
            "description": "Zoho Corporation is an Indian multinational technology company that makes computer software and web-based business tools.",
            "interview_process": "Zoho is known for very rigorous technical interviews. Multiple technical rounds focusing on coding, problem solving, and software design.",
            "difficulty": "Medium",
            "avg_salary": "₹5 - ₹20 LPA",
            "employee_count": "12,000+",
            "glassdoor_rating": 4.1,
            "preparation_tips": [
                "Very strong programming fundamentals required",
                "Practice complex coding problems",
                "Know your data structures inside out",
                "Focus on problem-solving approach",
            ],
            "frequently_asked_topics": ["Data Structures", "Algorithms", "Problem Solving", "Software Design"],
            "is_featured": True,
            "rounds": [
                {"round_number": 1, "round_name": "Written Test", "description": "Aptitude and programming", "duration_minutes": 180},
                {"round_number": 2, "round_name": "Programming Round", "description": "Complex coding problems", "duration_minutes": 120},
                {"round_number": 3, "round_name": "Advanced Technical", "description": "Data structures and design", "duration_minutes": 90},
                {"round_number": 4, "round_name": "HR Interview", "description": "Fit and background", "duration_minutes": 30},
            ],
        },
    ]

    for company_data in companies:
        rounds_data = company_data.pop("rounds", [])
        company = Company(**company_data)
        db.add(company)
        db.flush()

        for round_data in rounds_data:
            r = InterviewRound(**round_data, company_id=company.id)
            db.add(r)

    db.commit()
    logger.info(f"✅ {len(companies)} companies seeded")


def seed_questions(db):
    if db.query(Question).count() > 0:
        logger.info("Questions already seeded — skipping")
        return

    logger.info("Seeding questions...")
    questions = [
        # Quantitative
        {
            "title": "Train Speed Problem",
            "content": "A train travels 360 km in 4 hours. What is the speed of the train in km/h?",
            "question_type": QuestionType.MCQ,
            "category": QuestionCategory.QUANTITATIVE,
            "difficulty": Difficulty.EASY,
            "options": ["80 km/h", "90 km/h", "100 km/h", "120 km/h"],
            "correct_answer": "90 km/h",
            "explanation": "Speed = Distance/Time = 360/4 = 90 km/h",
            "tags": ["speed", "distance", "time"],
            "topic": "Speed, Distance & Time",
            "marks": 1.0,
        },
        {
            "title": "Percentage Calculation",
            "content": "What is 15% of 240?",
            "question_type": QuestionType.MCQ,
            "category": QuestionCategory.QUANTITATIVE,
            "difficulty": Difficulty.EASY,
            "options": ["30", "36", "42", "48"],
            "correct_answer": "36",
            "explanation": "15% of 240 = (15/100) × 240 = 36",
            "tags": ["percentage"],
            "topic": "Percentages",
            "marks": 1.0,
        },
        {
            "title": "Compound Interest",
            "content": "What is the compound interest on ₹10,000 at 10% per annum for 2 years?",
            "question_type": QuestionType.MCQ,
            "category": QuestionCategory.QUANTITATIVE,
            "difficulty": Difficulty.MEDIUM,
            "options": ["₹2,000", "₹2,100", "₹2,200", "₹2,300"],
            "correct_answer": "₹2,100",
            "explanation": "CI = P(1+r/100)^n - P = 10000(1.1)² - 10000 = 12100 - 10000 = 2100",
            "tags": ["interest", "compound interest"],
            "topic": "Simple & Compound Interest",
            "marks": 1.0,
        },
        # Logical
        {
            "title": "Number Series",
            "content": "Find the next number in the series: 2, 6, 12, 20, 30, ?",
            "question_type": QuestionType.MCQ,
            "category": QuestionCategory.LOGICAL,
            "difficulty": Difficulty.EASY,
            "options": ["40", "42", "44", "46"],
            "correct_answer": "42",
            "explanation": "Pattern: differences are 4, 6, 8, 10, 12. So next = 30 + 12 = 42",
            "tags": ["series", "patterns"],
            "topic": "Number Series",
            "marks": 1.0,
        },
        {
            "title": "Logical Syllogism",
            "content": "All roses are flowers. Some flowers fade quickly. Conclusion: Some roses fade quickly. Is this conclusion valid?",
            "question_type": QuestionType.MCQ,
            "category": QuestionCategory.LOGICAL,
            "difficulty": Difficulty.MEDIUM,
            "options": ["Definitely True", "Probably True", "Uncertain", "False"],
            "correct_answer": "Uncertain",
            "explanation": "We cannot conclude that some roses fade quickly. 'Some flowers that fade' might not include roses.",
            "tags": ["syllogism", "logic"],
            "topic": "Syllogisms",
            "marks": 1.0,
        },
        # Verbal
        {
            "title": "Synonyms",
            "content": "Choose the word most similar in meaning to 'EPHEMERAL':",
            "question_type": QuestionType.MCQ,
            "category": QuestionCategory.VERBAL,
            "difficulty": Difficulty.MEDIUM,
            "options": ["Permanent", "Transient", "Ancient", "Rigid"],
            "correct_answer": "Transient",
            "explanation": "Ephemeral means lasting for a very short time. Transient also means lasting for a short time.",
            "tags": ["vocabulary", "synonyms"],
            "topic": "Vocabulary",
            "marks": 1.0,
        },
        # Technical / Behavioral
        {
            "title": "OOP Concept",
            "content": "Which of the following is NOT a pillar of Object-Oriented Programming?",
            "question_type": QuestionType.MCQ,
            "category": QuestionCategory.TECHNICAL,
            "difficulty": Difficulty.EASY,
            "options": ["Encapsulation", "Polymorphism", "Inheritance", "Compilation"],
            "correct_answer": "Compilation",
            "explanation": "The 4 pillars of OOP are: Encapsulation, Polymorphism, Inheritance, and Abstraction. Compilation is not one of them.",
            "tags": ["OOP", "programming concepts"],
            "topic": "OOP",
            "marks": 1.0,
        },
        {
            "title": "Time Complexity",
            "content": "What is the time complexity of binary search?",
            "question_type": QuestionType.MCQ,
            "category": QuestionCategory.TECHNICAL,
            "difficulty": Difficulty.EASY,
            "options": ["O(n)", "O(n log n)", "O(log n)", "O(1)"],
            "correct_answer": "O(log n)",
            "explanation": "Binary search halves the search space at each step, giving O(log n) complexity.",
            "tags": ["algorithms", "time complexity"],
            "topic": "Algorithms",
            "marks": 1.0,
        },
        {
            "title": "SQL Query",
            "content": "Which SQL clause is used to filter groups in a GROUP BY query?",
            "question_type": QuestionType.MCQ,
            "category": QuestionCategory.TECHNICAL,
            "difficulty": Difficulty.EASY,
            "options": ["WHERE", "HAVING", "FILTER", "LIMIT"],
            "correct_answer": "HAVING",
            "explanation": "HAVING is used to filter groups after GROUP BY. WHERE filters individual rows before grouping.",
            "tags": ["SQL", "database"],
            "topic": "Database",
            "marks": 1.0,
        },
        # Behavioral
        {
            "title": "Conflict Resolution",
            "content": "Describe how you would handle a disagreement with a senior team member about the technical approach for a project.",
            "question_type": QuestionType.SUBJECTIVE,
            "category": QuestionCategory.BEHAVIORAL,
            "difficulty": Difficulty.MEDIUM,
            "options": [],
            "correct_answer": "Use respectful communication, present data to support your view, listen to their perspective, escalate if needed",
            "explanation": "Best answers involve respectful communication, data-driven arguments, active listening, and willingness to compromise.",
            "tags": ["behavioral", "conflict", "communication"],
            "topic": "Conflict Resolution",
            "marks": 2.0,
        },
    ]

    for q_data in questions:
        q = Question(**q_data)
        db.add(q)

    db.commit()
    logger.info(f"✅ {len(questions)} questions seeded")


def seed_coding_questions(db):
    if db.query(CodingQuestion).count() > 0:
        logger.info("Coding questions already seeded — skipping")
        return

    logger.info("Seeding coding questions...")
    problems = [
        {
            "title": "Two Sum",
            "slug": "two-sum",
            "problem_statement": "Given an array of integers `nums` and an integer `target`, return the indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.",
            "input_format": "First line: array of integers\nSecond line: target integer",
            "output_format": "Two indices separated by space",
            "constraints": "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9",
            "examples": [
                {"input": "nums = [2,7,11,15], target = 9", "output": "[0,1]", "explanation": "nums[0] + nums[1] = 2 + 7 = 9"},
                {"input": "nums = [3,2,4], target = 6", "output": "[1,2]", "explanation": "nums[1] + nums[2] = 2 + 4 = 6"},
            ],
            "hints": [
                "Use a hash map to store the complement of each number",
                "For each number, check if its complement exists in the map",
            ],
            "editorial": "Use a hash map. For each element, check if target - element exists in the map. O(n) time, O(n) space.",
            "difficulty": Difficulty.EASY,
            "category": "Arrays",
            "tags": ["Array", "Hash Table"],
            "supported_languages": ["python", "java", "cpp", "javascript"],
            "time_limit_ms": 2000,
            "memory_limit_kb": 262144,
            "test_cases": [
                {"input_data": "2 7 11 15\n9", "expected_output": "0 1", "is_sample": True},
                {"input_data": "3 2 4\n6", "expected_output": "1 2", "is_sample": True},
                {"input_data": "3 3\n6", "expected_output": "0 1", "is_sample": False},
            ],
        },
        {
            "title": "Reverse a String",
            "slug": "reverse-a-string",
            "problem_statement": "Write a function that reverses a string. The input string is given as an array of characters `s`.\n\nYou must do this by modifying the input array in-place with O(1) extra memory.",
            "input_format": "A string s",
            "output_format": "The reversed string",
            "constraints": "1 <= s.length <= 10^5\ns[i] is a printable ASCII character",
            "examples": [
                {"input": "s = 'hello'", "output": "'olleh'"},
                {"input": "s = 'Hannah'", "output": "'hannaH'"},
            ],
            "hints": ["Use two pointers — one at start, one at end", "Swap characters and move pointers towards center"],
            "editorial": "Two pointer approach: left=0, right=len-1, swap s[left] and s[right], move both inward. O(n) time, O(1) space.",
            "difficulty": Difficulty.EASY,
            "category": "Strings",
            "tags": ["String", "Two Pointers"],
            "supported_languages": ["python", "java", "cpp", "javascript"],
            "time_limit_ms": 1000,
            "memory_limit_kb": 131072,
            "test_cases": [
                {"input_data": "hello", "expected_output": "olleh", "is_sample": True},
                {"input_data": "Hannah", "expected_output": "hannaH", "is_sample": True},
                {"input_data": "A", "expected_output": "A", "is_sample": False},
            ],
        },
        {
            "title": "Fibonacci Number",
            "slug": "fibonacci-number",
            "problem_statement": "The Fibonacci numbers, commonly denoted F(n) form a sequence, called the Fibonacci sequence, such that each number is the sum of the two preceding ones, starting from 0 and 1.\n\nGiven n, calculate F(n).",
            "input_format": "A single integer n",
            "output_format": "The nth Fibonacci number",
            "constraints": "0 <= n <= 30",
            "examples": [
                {"input": "n = 4", "output": "3", "explanation": "F(4) = F(3) + F(2) = 2 + 1 = 3"},
                {"input": "n = 10", "output": "55"},
            ],
            "hints": ["Start with base cases: F(0) = 0, F(1) = 1", "Try both recursive and iterative approaches"],
            "editorial": "Use dynamic programming or simple iteration. F[i] = F[i-1] + F[i-2]. O(n) time, O(1) space.",
            "difficulty": Difficulty.EASY,
            "category": "Dynamic Programming",
            "tags": ["Math", "Dynamic Programming", "Recursion"],
            "supported_languages": ["python", "java", "cpp", "javascript"],
            "time_limit_ms": 1000,
            "memory_limit_kb": 131072,
            "test_cases": [
                {"input_data": "4", "expected_output": "3", "is_sample": True},
                {"input_data": "10", "expected_output": "55", "is_sample": True},
                {"input_data": "0", "expected_output": "0", "is_sample": False},
                {"input_data": "1", "expected_output": "1", "is_sample": False},
            ],
        },
        {
            "title": "Valid Parentheses",
            "slug": "valid-parentheses",
            "problem_statement": "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
            "input_format": "A string containing only brackets",
            "output_format": "true or false",
            "constraints": "1 <= s.length <= 10^4\ns consists of parentheses only '()[]{}'",
            "examples": [
                {"input": "s = '()'", "output": "true"},
                {"input": "s = '()[]{}'", "output": "true"},
                {"input": "s = '(]'", "output": "false"},
            ],
            "hints": ["Use a stack data structure", "Push opening brackets, pop and match when seeing closing brackets"],
            "editorial": "Stack-based solution. Push opening brackets, when seeing closing bracket, check top of stack matches. O(n) time.",
            "difficulty": Difficulty.EASY,
            "category": "Stack & Queue",
            "tags": ["String", "Stack"],
            "supported_languages": ["python", "java", "cpp", "javascript"],
            "time_limit_ms": 1000,
            "memory_limit_kb": 131072,
            "test_cases": [
                {"input_data": "()", "expected_output": "true", "is_sample": True},
                {"input_data": "()[]{}", "expected_output": "true", "is_sample": True},
                {"input_data": "(]", "expected_output": "false", "is_sample": True},
                {"input_data": "([)]", "expected_output": "false", "is_sample": False},
            ],
        },
        {
            "title": "Maximum Subarray",
            "slug": "maximum-subarray",
            "problem_statement": "Given an integer array nums, find the subarray with the largest sum, and return its sum.\n\nThis is the classic Kadane's Algorithm problem.",
            "input_format": "Space-separated integers representing the array",
            "output_format": "The maximum subarray sum",
            "constraints": "1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4",
            "examples": [
                {"input": "nums = [-2,1,-3,4,-1,2,1,-5,4]", "output": "6", "explanation": "[4,-1,2,1] has the largest sum = 6"},
                {"input": "nums = [1]", "output": "1"},
                {"input": "nums = [5,4,-1,7,8]", "output": "23"},
            ],
            "hints": ["Look up Kadane's Algorithm", "Keep track of current_sum and max_sum"],
            "editorial": "Kadane's Algorithm: current_max = max(num, current_max + num), global_max = max(global_max, current_max). O(n) time.",
            "difficulty": Difficulty.MEDIUM,
            "category": "Dynamic Programming",
            "tags": ["Array", "Dynamic Programming", "Divide and Conquer"],
            "supported_languages": ["python", "java", "cpp", "javascript"],
            "time_limit_ms": 2000,
            "memory_limit_kb": 262144,
            "test_cases": [
                {"input_data": "-2 1 -3 4 -1 2 1 -5 4", "expected_output": "6", "is_sample": True},
                {"input_data": "1", "expected_output": "1", "is_sample": True},
                {"input_data": "5 4 -1 7 8", "expected_output": "23", "is_sample": False},
            ],
        },
    ]

    for p_data in problems:
        test_cases_data = p_data.pop("test_cases", [])
        problem = CodingQuestion(**p_data)
        db.add(problem)
        db.flush()
        for tc_data in test_cases_data:
            tc = TestCase(**tc_data, question_id=problem.id, is_hidden=not tc_data.get("is_sample", False))
            db.add(tc)

    db.commit()
    logger.info(f"✅ {len(problems)} coding problems seeded")


def seed_aptitude_tests(db):
    if db.query(AptitudeTest).count() > 0:
        logger.info("Aptitude tests already seeded — skipping")
        return

    logger.info("Seeding aptitude tests...")
    tests = [
        {"title": "Quantitative Aptitude — Easy", "category": QuestionCategory.QUANTITATIVE, "difficulty": Difficulty.EASY, "duration_minutes": 20, "total_questions": 10, "total_marks": 10.0},
        {"title": "Quantitative Aptitude — Medium", "category": QuestionCategory.QUANTITATIVE, "difficulty": Difficulty.MEDIUM, "duration_minutes": 30, "total_questions": 15, "total_marks": 15.0},
        {"title": "Logical Reasoning — Easy", "category": QuestionCategory.LOGICAL, "difficulty": Difficulty.EASY, "duration_minutes": 20, "total_questions": 10, "total_marks": 10.0},
        {"title": "Verbal Ability — Easy", "category": QuestionCategory.VERBAL, "difficulty": Difficulty.EASY, "duration_minutes": 20, "total_questions": 10, "total_marks": 10.0},
        {"title": "Technical Aptitude — Medium", "category": QuestionCategory.TECHNICAL, "difficulty": Difficulty.MEDIUM, "duration_minutes": 30, "total_questions": 15, "total_marks": 15.0},
        {"title": "Mixed Aptitude Test", "category": QuestionCategory.GENERAL, "difficulty": Difficulty.MEDIUM, "duration_minutes": 45, "total_questions": 25, "total_marks": 25.0, "negative_marking": True, "negative_marks_per_wrong": 0.25},
    ]

    for t in tests:
        test = AptitudeTest(**t)
        db.add(test)

    db.commit()
    logger.info(f"✅ {len(tests)} aptitude tests seeded")


def seed_achievements(db):
    if db.query(Achievement).count() > 0:
        logger.info("Achievements already seeded — skipping")
        return

    logger.info("Seeding achievements...")
    achievements = [
        {"name": "First Step", "description": "Solve your first question", "icon": "🌟", "badge_color": "#F59E0B", "category": "General", "condition_type": "questions_solved", "condition_value": 1, "points_reward": 10},
        {"name": "Problem Solver", "description": "Solve 10 questions", "icon": "🎯", "badge_color": "#2563EB", "category": "General", "condition_type": "questions_solved", "condition_value": 10, "points_reward": 50},
        {"name": "Century Club", "description": "Solve 100 questions", "icon": "💯", "badge_color": "#7C3AED", "category": "General", "condition_type": "questions_solved", "condition_value": 100, "points_reward": 500},
        {"name": "Code Warrior", "description": "Solve 10 coding challenges", "icon": "💻", "badge_color": "#059669", "category": "Coding", "condition_type": "coding_solved", "condition_value": 10, "points_reward": 100},
        {"name": "Coding Master", "description": "Solve 50 coding challenges", "icon": "🏆", "badge_color": "#D97706", "category": "Coding", "condition_type": "coding_solved", "condition_value": 50, "points_reward": 500},
        {"name": "7-Day Streak", "description": "Study for 7 consecutive days", "icon": "🔥", "badge_color": "#EF4444", "category": "Streak", "condition_type": "streak_days", "condition_value": 7, "points_reward": 100},
        {"name": "30-Day Streak", "description": "Study for 30 consecutive days", "icon": "⚡", "badge_color": "#8B5CF6", "category": "Streak", "condition_type": "streak_days", "condition_value": 30, "points_reward": 500},
        {"name": "Interview Expert", "description": "Complete 5 mock interviews", "icon": "🎤", "badge_color": "#EC4899", "category": "Interview", "condition_type": "interviews_completed", "condition_value": 5, "points_reward": 200},
        {"name": "Resume Champion", "description": "Achieve 80+ resume score", "icon": "📄", "badge_color": "#06B6D4", "category": "Resume", "condition_type": "resume_score", "condition_value": 80, "points_reward": 150},
        {"name": "Aptitude Expert", "description": "Complete 10 aptitude tests", "icon": "📊", "badge_color": "#F97316", "category": "Aptitude", "condition_type": "tests_taken", "condition_value": 10, "points_reward": 200},
        {"name": "Top Performer", "description": "Reach top 10 on the leaderboard", "icon": "👑", "badge_color": "#EAB308", "category": "Leaderboard", "condition_type": "global_rank", "condition_value": 10, "points_reward": 1000},
    ]

    for a_data in achievements:
        a = Achievement(**a_data)
        db.add(a)

    db.commit()
    logger.info(f"✅ {len(achievements)} achievements seeded")


if __name__ == "__main__":
    seed_all()
