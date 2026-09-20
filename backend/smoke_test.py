"""
End-to-end API smoke test for the AI Interview Preparation Portal.

Run with the server up:
    python smoke_test.py [base_url]

Exits with code 0 when all checks pass, 1 otherwise.
"""
import sys
import time
# pyrefly: ignore [missing-import]
import httpx

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
API = f"{BASE}/api/v1"

passed = 0
failed = 0
failures = []


def check(name, ok, detail=""):
    global passed, failed
    if ok:
        passed += 1
        print(f"  PASS  {name}")
    else:
        failed += 1
        failures.append(f"{name} — {detail}")
        print(f"  FAIL  {name} — {detail}")


client = httpx.Client(base_url=API, timeout=90.0, follow_redirects=True)


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def login(email, password):
    r = client.post("/auth/login", json={"email": email, "password": password})
    if r.status_code != 200:
        return None
    return r.json().get("access_token")


print(f"== Smoke test against {API} ==")

# ---------- Health ----------
r = client.get(f"{BASE}/health")
check("GET /health", r.status_code == 200 and r.json().get("status") == "healthy", f"status={r.status_code}")

# ---------- Auth ----------
student_token = login("alice@example.com", "Student@123")
check("student login (alice)", student_token is not None)
admin_token = login("admin@aiinterview.com", "Admin@123")
check("admin login", admin_token is not None)

r = client.post("/auth/login", json={"email": "alice@example.com", "password": "wrongpass"})
check("login with wrong password -> 401", r.status_code == 401, f"status={r.status_code}")

r = client.get("/users/me")
check("no token -> 401", r.status_code == 401, f"status={r.status_code}")

if student_token:
    r = client.get("/users/me", headers=auth_headers(student_token))
    check("GET /users/me", r.status_code == 200 and r.json().get("email") == "alice@example.com", f"status={r.status_code}")

    # ---------- Questions ----------
    r = client.get("/questions", headers=auth_headers(student_token))
    qs = r.json()
    check("questions list is paginated {questions,total}", r.status_code == 200 and isinstance(qs.get("questions"), list) and "total" in qs, f"keys={list(qs.keys()) if isinstance(qs, dict) else type(qs)}")
    first_q = (qs.get("questions") or [{}])[0]
    check("question has bookmarked flag", "bookmarked" in first_q, f"keys={list(first_q.keys())}")

    r = client.get("/questions/categories", headers=auth_headers(student_token))
    cats = r.json()
    check("question categories are [{value,label}]", isinstance(cats, list) and all(isinstance(c, dict) and "value" in c and "label" in c for c in cats), f"type={type(cats)}")

    if first_q.get("id"):
        r = client.post(f"/questions/{first_q['id']}/bookmark", headers=auth_headers(student_token))
        check("toggle bookmark", r.status_code == 200 and "bookmarked" in r.json(), f"status={r.status_code}")
        r = client.get("/questions/bookmarks/me", headers=auth_headers(student_token))
        check("bookmarks/me returns list", r.status_code == 200 and isinstance(r.json(), list), f"status={r.status_code}")

    # ---------- Coding ----------
    r = client.get("/coding", headers=auth_headers(student_token))
    probs = r.json()
    check("coding list", r.status_code == 200 and isinstance(probs, list), f"status={r.status_code}")
    r = client.get("/coding/submissions/me", headers=auth_headers(student_token))
    check("coding submissions/me", r.status_code == 200, f"status={r.status_code}")

    # ---------- Aptitude ----------
    r = client.get("/aptitude/tests", headers=auth_headers(student_token))
    tests = r.json()
    test_list = tests if isinstance(tests, list) else tests.get("tests", [])
    check("aptitude tests list", r.status_code == 200, f"status={r.status_code}")
    if test_list:
        tid = test_list[0]["id"]
        r = client.post(f"/aptitude/tests/{tid}/start", headers=auth_headers(student_token))
        check("aptitude start test", r.status_code == 200 and "attempt_id" in r.json(), f"status={r.status_code} {r.text[:120]}")
        if r.status_code == 200:
            body = r.json()
            answers = {}
            for q in body.get("questions", []):
                answers[str(q["id"])] = q["options"][0] if q.get("options") else "A"
            r = client.post(f"/aptitude/attempts/{body['attempt_id']}/submit", json={"answers": answers, "time_taken_seconds": 60}, headers=auth_headers(student_token))
            check("aptitude submit test", r.status_code == 200 and "score" in r.json(), f"status={r.status_code} {r.text[:120]}")
        r = client.get("/aptitude/attempts/me", headers=auth_headers(student_token))
        check("aptitude attempts/me", r.status_code == 200, f"status={r.status_code}")

    # ---------- Mock Interview (AI uses mock fallback when needed) ----------
    r = client.post("/interviews/start", json={"company_id": None, "interview_type": "technical", "difficulty": "easy", "num_questions": 2, "target_role": "Software Engineer"}, headers=auth_headers(student_token))
    check("interview start", r.status_code == 201 and "interview_id" in r.json(), f"status={r.status_code} {r.text[:150]}")
    if r.status_code == 201:
        body = r.json()
        iid = body["interview_id"]
        qnum = body["question_number"]
        qtext = body["question_text"]
        r = client.post("/interviews/answer", json={"interview_id": iid, "question_number": qnum, "question_text": qtext, "student_answer": "I would analyze requirements, design a clean solution, implement it and test it thoroughly."}, headers=auth_headers(student_token))
        check("interview answer Q1", r.status_code == 200 and "is_complete" in r.json(), f"status={r.status_code} {r.text[:150]}")
        if r.status_code == 200 and not r.json().get("is_complete"):
            r = client.post("/interviews/answer", json={"interview_id": iid, "question_number": 2, "question_text": r.json().get("next_question", ""), "student_answer": "I would break the problem into smaller parts and use appropriate data structures."}, headers=auth_headers(student_token))
            check("interview answer Q2 (complete)", r.status_code == 200 and r.json().get("is_complete") is True, f"status={r.status_code} {r.text[:150]}")
        r = client.get(f"/interviews/{iid}", headers=auth_headers(student_token))
        check("interview detail has current_question", r.status_code == 200 and "current_question" in r.json() and "responses" in r.json(), f"status={r.status_code} keys={list(r.json().keys()) if r.status_code == 200 else ''}")
        r = client.get(f"/interviews/{iid}/download-report", headers=auth_headers(student_token))
        check("interview report download", r.status_code == 200 and "pdf" in r.headers.get("content-type", ""), f"status={r.status_code} ct={r.headers.get('content-type')}")
    r = client.get("/interviews/me", headers=auth_headers(student_token))
    check("interviews/me", r.status_code == 200 and isinstance(r.json(), list), f"status={r.status_code}")

    # ---------- Companies ----------
    r = client.get("/companies", headers=auth_headers(student_token))
    comps = r.json()
    check("companies list has avg_salary", r.status_code == 200 and isinstance(comps, list) and (not comps or "avg_salary" in comps[0]), f"status={r.status_code} keys={list(comps[0].keys()) if comps else 'empty'}")
    if isinstance(comps, list) and comps:
        r = client.get(f"/companies/{comps[0]['slug']}", headers=auth_headers(student_token))
        check("company detail", r.status_code == 200 and "rounds" in r.json(), f"status={r.status_code}")

    # ---------- Leaderboard ----------
    r = client.get("/leaderboard/global", headers=auth_headers(student_token))
    lb = r.json()
    check("leaderboard global has data + field names", r.status_code == 200 and isinstance(lb.get("data"), list) and (not lb["data"] or ("total_points" in lb["data"][0] and "username" in lb["data"][0])), f"status={r.status_code} keys={list(lb.keys()) if isinstance(lb, dict) else type(lb)}")
    for tab in ["weekly", "monthly", "college"]:
        r = client.get(f"/leaderboard/{tab}", headers=auth_headers(student_token))
        check(f"leaderboard {tab}", r.status_code == 200 and "data" in r.json(), f"status={r.status_code}")

    # ---------- Notifications ----------
    r = client.get("/notifications", headers=auth_headers(student_token))
    nf = r.json()
    check("notifications has notifications key", r.status_code == 200 and isinstance(nf.get("notifications"), list), f"status={r.status_code} keys={list(nf.keys()) if isinstance(nf, dict) else type(nf)}")
    r = client.patch("/notifications/read-all", headers=auth_headers(student_token))
    check("notifications mark-all-read", r.status_code == 200, f"status={r.status_code}")

    # ---------- Dashboard ----------
    r = client.get("/dashboard/stats", headers=auth_headers(student_token))
    ds = r.json()
    check("dashboard stats has stats wrapper", r.status_code == 200 and "stats" in ds and "user" in ds, f"status={r.status_code} keys={list(ds.keys()) if isinstance(ds, dict) else type(ds)}")
    r = client.get("/dashboard/activity?days=30", headers=auth_headers(student_token))
    da = r.json()
    check("dashboard activity is {activity: map}", r.status_code == 200 and isinstance(da.get("activity"), dict), f"status={r.status_code} keys={list(da.keys()) if isinstance(da, dict) else type(da)}")
    r = client.get("/dashboard/performance-charts", headers=auth_headers(student_token))
    dc = r.json()
    check("performance-charts has weekly_progress", r.status_code == 200 and "weekly_progress" in dc and "aptitude_by_category" in dc, f"status={r.status_code} keys={list(dc.keys()) if isinstance(dc, dict) else type(dc)}")
    r = client.get("/dashboard/recent-activity?limit=5", headers=auth_headers(student_token))
    check("dashboard recent-activity", r.status_code == 200, f"status={r.status_code}")

    # ---------- Profile ----------
    r = client.get("/users/me/profile", headers=auth_headers(student_token))
    prof = r.json()
    check("profile has educations/experiences lists", r.status_code == 200 and isinstance(prof.get("educations"), list) and isinstance(prof.get("experiences"), list), f"status={r.status_code} keys={list(prof.keys()) if isinstance(prof, dict) else type(prof)}")
    r = client.post("/users/me/education", json={"institution": "Smoke Test University", "degree": "B.Tech", "field_of_study": "Computer Science", "grade": "8.5"}, headers=auth_headers(student_token))
    check("profile add education", r.status_code == 201 and "id" in r.json(), f"status={r.status_code} {r.text[:120]}")
    if r.status_code == 201:
        edu_id = r.json()["id"]
        r = client.delete(f"/users/me/education/{edu_id}", headers=auth_headers(student_token))
        check("profile delete education", r.status_code == 200, f"status={r.status_code}")
    r = client.post("/users/me/skills", json={"name": "SmokeSkill", "category": "Programming", "proficiency": "Intermediate"}, headers=auth_headers(student_token))
    check("profile add skill", r.status_code == 201, f"status={r.status_code} {r.text[:120]}")
    if r.status_code == 201:
        client.delete(f"/users/me/skills/{r.json()['id']}", headers=auth_headers(student_token))

    # ---------- Achievements ----------
    r = client.get("/achievements/me", headers=auth_headers(student_token))
    ach = r.json()
    check("achievements/me shape", r.status_code == 200 and isinstance(ach.get("achievements"), list) and "total_points" in ach and "unlocked" in (ach["achievements"][0] if ach["achievements"] else {}), f"status={r.status_code} keys={list(ach.keys()) if isinstance(ach, dict) else type(ach)}")

    # ---------- Study Planner ----------
    r = client.get("/study-planner/tasks", headers=auth_headers(student_token))
    check("study tasks list", r.status_code == 200, f"status={r.status_code}")
    r = client.post("/study-planner/tasks", json={"text": "Smoke Task", "category": "General", "date": "Today", "priority": "medium"}, headers=auth_headers(student_token))
    check("study task create", r.status_code == 201 and "id" in r.json(), f"status={r.status_code} {r.text[:120]}")
    if r.status_code == 201:
        tid = r.json()["id"]
        client.patch(f"/study-planner/tasks/{tid}/toggle", headers=auth_headers(student_token))
        client.delete(f"/study-planner/tasks/{tid}", headers=auth_headers(student_token))

    # ---------- Flashcards ----------
    r = client.get("/flashcards", headers=auth_headers(student_token))
    check("flashcards list", r.status_code == 200, f"status={r.status_code}")
    r = client.post("/flashcards", json={"front": "Smoke Q?", "back": "Smoke A", "topic": "General", "difficulty": "Medium"}, headers=auth_headers(student_token))
    check("flashcard create", r.status_code == 201, f"status={r.status_code} {r.text[:120]}")
    if r.status_code == 201:
        client.delete(f"/flashcards/{r.json()['id']}", headers=auth_headers(student_token))

    # ---------- Notes ----------
    r = client.post("/notes", json={"title": "Smoke Note", "content": "test", "tags": "api"}, headers=auth_headers(student_token))
    check("note create", r.status_code == 201, f"status={r.status_code} {r.text[:120]}")
    if r.status_code == 201:
        client.delete(f"/notes/{r.json()['id']}", headers=auth_headers(student_token))

    # ---------- Discussion ----------
    r = client.get("/discussion/posts", headers=auth_headers(student_token))
    check("discussion posts list", r.status_code == 200 and isinstance(r.json().get("posts"), list), f"status={r.status_code}")
    r = client.post("/discussion/posts", json={"title": "Smoke Post", "content": "Hello from smoke test", "topic": "general", "tags": "test"}, headers=auth_headers(student_token))
    check("discussion create post", r.status_code == 201, f"status={r.status_code} {r.text[:120]}")
    if r.status_code == 201:
        pid = r.json().get("id")
        if pid:
            client.post(f"/discussion/posts/{pid}/like", headers=auth_headers(student_token))
            r = client.post(f"/discussion/posts/{pid}/comments", json={"content": "nice"}, headers=auth_headers(student_token))
            check("discussion add comment", r.status_code == 201, f"status={r.status_code}")
            client.delete(f"/discussion/posts/{pid}", headers=auth_headers(student_token))

    # ---------- RBAC ----------
    r = client.get("/admin/stats", headers=auth_headers(student_token))
    check("student blocked from admin -> 403", r.status_code == 403, f"status={r.status_code}")

# ---------- Admin ----------
if admin_token:
    ah = auth_headers(admin_token)
    r = client.get("/admin/stats", headers=ah)
    st = r.json()
    check("admin stats has overview", r.status_code == 200 and isinstance(st.get("overview"), dict) and "total_users" in st["overview"], f"status={r.status_code} keys={list(st.keys()) if isinstance(st, dict) else type(st)}")
    r = client.get("/admin/users", headers=ah)
    us = r.json()
    check("admin users has data", r.status_code == 200 and isinstance(us.get("data"), list) and "total" in us, f"status={r.status_code} keys={list(us.keys()) if isinstance(us, dict) else type(us)}")
    r = client.get("/admin/questions/stats", headers=ah)
    check("admin question stats", r.status_code == 200 and "question_stats" in r.json(), f"status={r.status_code}")
    r = client.get("/admin/submissions/recent?limit=5", headers=ah)
    check("admin recent submissions", r.status_code == 200 and isinstance(r.json(), list), f"status={r.status_code}")
    r = client.get("/admin/interviews/stats", headers=ah)
    ivs = r.json()
    check("admin interview stats keys", r.status_code == 200 and "total_interviews" in ivs and "avg_overall_score" in ivs, f"status={r.status_code} keys={list(ivs.keys()) if isinstance(ivs, dict) else type(ivs)}")
    r = client.get("/admin/interviews", headers=ah)
    ivl = r.json()
    check("admin interviews list", r.status_code == 200 and isinstance(ivl.get("data"), list) and (not ivl["data"] or "candidate" in ivl["data"][0]), f"status={r.status_code} keys={list(ivl.keys()) if isinstance(ivl, dict) else type(ivl)}")
    if us.get("data"):
        target = us["data"][0]
        r = client.patch(f"/users/{target['id']}/toggle-active", headers=ah)
        check("admin toggle user active", r.status_code == 200, f"status={r.status_code} {r.text[:120]}")
        client.patch(f"/users/{target['id']}/toggle-active", headers=ah)

print()
print(f"Results: {passed} passed, {failed} failed")
if failures:
    print("\nFailures:")
    for f in failures:
        print(f"  - {f}")
sys.exit(1 if failed else 0)
