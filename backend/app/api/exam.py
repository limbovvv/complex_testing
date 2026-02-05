from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_session
from app.models import Question, ProgTask, ExamAttempt, AttemptAnswer, AttemptProg
from app.schemas.exam import AnswerIn, DraftIn, ExamStateOut, ExamResultOut
from app.worker.celery_app import celery_app

router = APIRouter(prefix="/exam", tags=["exam"])


async def _get_attempt(session: AsyncSession, user_id: int) -> ExamAttempt | None:
    result = await session.execute(select(ExamAttempt).where(ExamAttempt.user_id == user_id))
    return result.scalar_one_or_none()


@router.post("/start", response_model=ExamStateOut)
async def start_exam(current=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    existing = await _get_attempt(session, current.id)
    if existing:
        raise HTTPException(status_code=400, detail="Attempt already exists")

    now = datetime.now(timezone.utc)
    ends_at = now + timedelta(minutes=60)
    attempt = ExamAttempt(user_id=current.id, started_at=now, ends_at=ends_at, status="in_progress")
    session.add(attempt)
    await session.commit()
    await session.refresh(attempt)

    return await get_state(current, session)


@router.get("/state", response_model=ExamStateOut)
async def get_state(current=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    attempt = await _get_attempt(session, current.id)
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    now = datetime.now(timezone.utc)
    if attempt.status == "in_progress" and now >= attempt.ends_at:
        attempt.status = "timed_out"
        attempt.submitted_at = now
        await session.commit()
        celery_app.send_task("grade_attempt", args=[attempt.id])

    result_math = await session.execute(select(Question).where(Question.subject == "math", Question.published.is_(True)))
    result_ru = await session.execute(select(Question).where(Question.subject == "ru", Question.published.is_(True)))
    result_prog = await session.execute(select(ProgTask).where(ProgTask.published.is_(True)))

    math_questions = [
        {"id": q.id, "question": q.question, "options": q.options, "points": q.points}
        for q in result_math.scalars().all()
    ]
    ru_questions = [
        {"id": q.id, "question": q.question, "options": q.options, "points": q.points}
        for q in result_ru.scalars().all()
    ]
    prog_tasks = [
        {"id": t.id, "title": t.title, "statement": t.statement, "points": t.points}
        for t in result_prog.scalars().all()
    ]

    answers = {}
    res_ans = await session.execute(select(AttemptAnswer).where(AttemptAnswer.attempt_id == attempt.id))
    for a in res_ans.scalars().all():
        answers[str(a.question_id)] = a.selected_index

    drafts = {}
    res_prog = await session.execute(select(AttemptProg).where(AttemptProg.attempt_id == attempt.id))
    for d in res_prog.scalars().all():
        drafts[str(d.task_id)] = {"language": d.language, "code": d.code}

    return ExamStateOut(
        attempt_id=attempt.id,
        status=attempt.status,
        started_at=attempt.started_at,
        ends_at=attempt.ends_at,
        math_questions=math_questions,
        ru_questions=ru_questions,
        prog_tasks=prog_tasks,
        answers=answers,
        drafts=drafts,
    )


async def _check_attempt_open(session: AsyncSession, attempt: ExamAttempt):
    now = datetime.now(timezone.utc)
    if attempt.status != "in_progress":
        raise HTTPException(status_code=400, detail="Attempt is closed")
    if now >= attempt.ends_at:
        attempt.status = "timed_out"
        attempt.submitted_at = now
        await session.commit()
        celery_app.send_task("grade_attempt", args=[attempt.id])
        raise HTTPException(status_code=400, detail="Attempt time is over")


@router.put("/answer/{question_id}")
async def save_answer(
    question_id: int,
    data: AnswerIn,
    current=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    attempt = await _get_attempt(session, current.id)
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    await _check_attempt_open(session, attempt)

    res = await session.execute(
        select(AttemptAnswer).where(
            AttemptAnswer.attempt_id == attempt.id, AttemptAnswer.question_id == question_id
        )
    )
    ans = res.scalar_one_or_none()
    if not ans:
        ans = AttemptAnswer(attempt_id=attempt.id, question_id=question_id, selected_index=data.selected_index)
        session.add(ans)
    else:
        ans.selected_index = data.selected_index
    await session.commit()
    return {"status": "ok"}


@router.put("/draft/{task_id}")
async def save_draft(
    task_id: int,
    data: DraftIn,
    current=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    attempt = await _get_attempt(session, current.id)
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    await _check_attempt_open(session, attempt)

    res = await session.execute(
        select(AttemptProg).where(AttemptProg.attempt_id == attempt.id, AttemptProg.task_id == task_id)
    )
    draft = res.scalar_one_or_none()
    if not draft:
        draft = AttemptProg(attempt_id=attempt.id, task_id=task_id, language=data.language, code=data.code)
        session.add(draft)
    else:
        draft.language = data.language
        draft.code = data.code
    await session.commit()
    return {"status": "ok"}


@router.post("/submit")
async def submit_exam(current=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    attempt = await _get_attempt(session, current.id)
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    if attempt.status != "in_progress":
        raise HTTPException(status_code=400, detail="Attempt already closed")

    attempt.status = "submitted"
    attempt.submitted_at = datetime.now(timezone.utc)
    await session.commit()

    celery_app.send_task("grade_attempt", args=[attempt.id])
    return {"status": "submitted"}


@router.get("/result", response_model=ExamResultOut)
async def get_result(current=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    attempt = await _get_attempt(session, current.id)
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    if attempt.status == "in_progress":
        raise HTTPException(status_code=400, detail="Attempt not submitted")

    per_question = {}
    res_ans = await session.execute(select(AttemptAnswer).where(AttemptAnswer.attempt_id == attempt.id))
    for a in res_ans.scalars().all():
        per_question[str(a.question_id)] = bool(a.is_correct)

    per_task = {}
    res_prog = await session.execute(select(AttemptProg).where(AttemptProg.attempt_id == attempt.id))
    for d in res_prog.scalars().all():
        per_task[str(d.task_id)] = bool(d.is_correct)

    return ExamResultOut(
        attempt_id=attempt.id,
        status=attempt.status,
        score_total=attempt.score_total or 0,
        score_blocks=attempt.score_blocks or {},
        per_question=per_question,
        per_task=per_task,
    )
