from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_admin_user
from app.db.session import get_session
from app.models import Question, ProgTask, ProgTestcase, ExamAttempt, AttemptAnswer, AttemptProg, User
from app.schemas.question import QuestionIn, QuestionOut
from app.schemas.prog import ProgTaskIn, ProgTaskOut, ProgTestcaseIn, ProgTestcaseOut

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(get_admin_user)])


@router.get("/questions", response_model=list[QuestionOut])
async def list_questions(session: AsyncSession = Depends(get_session)):
    res = await session.execute(select(Question))
    return res.scalars().all()


@router.post("/questions", response_model=QuestionOut)
async def create_question(data: QuestionIn, session: AsyncSession = Depends(get_session)):
    if data.subject in {"math", "ru"} and not (data.correct_answer and data.correct_answer.strip()):
        raise HTTPException(status_code=400, detail="Correct answer is required for math/ru")
    q = Question(**data.model_dump())
    session.add(q)
    await session.commit()
    await session.refresh(q)
    return q


@router.put("/questions/{question_id}", response_model=QuestionOut)
async def update_question(question_id: int, data: QuestionIn, session: AsyncSession = Depends(get_session)):
    res = await session.execute(select(Question).where(Question.id == question_id))
    q = res.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Not found")
    if data.subject in {"math", "ru"} and not (data.correct_answer and data.correct_answer.strip()):
        raise HTTPException(status_code=400, detail="Correct answer is required for math/ru")
    for k, v in data.model_dump().items():
        setattr(q, k, v)
    await session.commit()
    await session.refresh(q)
    return q


@router.delete("/questions/{question_id}")
async def delete_question(question_id: int, session: AsyncSession = Depends(get_session)):
    res = await session.execute(select(Question).where(Question.id == question_id))
    q = res.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Not found")
    await session.delete(q)
    await session.commit()
    return {"status": "deleted"}


@router.get("/prog_tasks", response_model=list[ProgTaskOut])
async def list_tasks(session: AsyncSession = Depends(get_session)):
    res = await session.execute(select(ProgTask))
    return res.scalars().all()


@router.post("/prog_tasks", response_model=ProgTaskOut)
async def create_task(data: ProgTaskIn, session: AsyncSession = Depends(get_session)):
    t = ProgTask(**data.model_dump())
    session.add(t)
    await session.commit()
    await session.refresh(t)
    return t


@router.put("/prog_tasks/{task_id}", response_model=ProgTaskOut)
async def update_task(task_id: int, data: ProgTaskIn, session: AsyncSession = Depends(get_session)):
    res = await session.execute(select(ProgTask).where(ProgTask.id == task_id))
    t = res.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in data.model_dump().items():
        setattr(t, k, v)
    await session.commit()
    await session.refresh(t)
    return t


@router.delete("/prog_tasks/{task_id}")
async def delete_task(task_id: int, session: AsyncSession = Depends(get_session)):
    res = await session.execute(select(ProgTask).where(ProgTask.id == task_id))
    t = res.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Not found")
    await session.delete(t)
    await session.commit()
    return {"status": "deleted"}


@router.get("/prog_testcases", response_model=list[ProgTestcaseOut])
async def list_testcases(session: AsyncSession = Depends(get_session)):
    res = await session.execute(select(ProgTestcase))
    return res.scalars().all()


@router.post("/prog_testcases", response_model=ProgTestcaseOut)
async def create_testcase(data: ProgTestcaseIn, session: AsyncSession = Depends(get_session)):
    t = ProgTestcase(**data.model_dump())
    session.add(t)
    await session.commit()
    await session.refresh(t)
    return t


@router.put("/prog_testcases/{testcase_id}", response_model=ProgTestcaseOut)
async def update_testcase(testcase_id: int, data: ProgTestcaseIn, session: AsyncSession = Depends(get_session)):
    res = await session.execute(select(ProgTestcase).where(ProgTestcase.id == testcase_id))
    t = res.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in data.model_dump().items():
        setattr(t, k, v)
    await session.commit()
    await session.refresh(t)
    return t


@router.delete("/prog_testcases/{testcase_id}")
async def delete_testcase(testcase_id: int, session: AsyncSession = Depends(get_session)):
    res = await session.execute(select(ProgTestcase).where(ProgTestcase.id == testcase_id))
    t = res.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Not found")
    await session.delete(t)
    await session.commit()
    return {"status": "deleted"}


@router.post("/publish/{entity}/{entity_id}")
async def publish_entity(entity: str, entity_id: int, session: AsyncSession = Depends(get_session)):
    model_map = {"questions": Question, "prog_tasks": ProgTask}
    if entity not in model_map:
        raise HTTPException(status_code=400, detail="Invalid entity")
    model = model_map[entity]
    res = await session.execute(select(model).where(model.id == entity_id))
    obj = res.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Not found")
    obj.published = not obj.published
    await session.commit()
    return {"id": obj.id, "published": obj.published}


@router.get("/stats")
async def stats(session: AsyncSession = Depends(get_session)):
    total_attempts = (await session.execute(select(func.count(ExamAttempt.id)))).scalar() or 0
    submitted = (await session.execute(select(func.count(ExamAttempt.id)).where(ExamAttempt.status == "submitted"))).scalar() or 0
    timed_out = (await session.execute(select(func.count(ExamAttempt.id)).where(ExamAttempt.status == "timed_out"))).scalar() or 0

    avg_score = (await session.execute(select(func.avg(ExamAttempt.score_total)))).scalar() or 0

    solved_tasks = (await session.execute(select(func.count(AttemptProg.id)).where(AttemptProg.is_correct.is_(True)))).scalar() or 0
    total_task_answers = (await session.execute(select(func.count(AttemptProg.id)))).scalar() or 0

    return {
        "total_attempts": total_attempts,
        "submitted": submitted,
        "timed_out": timed_out,
        "avg_score": float(avg_score),
        "task_solve_rate": (solved_tasks / total_task_answers) if total_task_answers else 0,
    }


@router.get("/attempts")
async def attempts(session: AsyncSession = Depends(get_session)):
    res = await session.execute(
        select(ExamAttempt, User)
        .join(User, User.id == ExamAttempt.user_id)
        .order_by(ExamAttempt.id.desc())
    )
    rows = res.all()
    now = datetime.now(timezone.utc)

    total_math = (
        await session.execute(select(func.count(Question.id)).where(Question.subject == "math", Question.published.is_(True)))
    ).scalar() or 0
    total_ru = (
        await session.execute(select(func.count(Question.id)).where(Question.subject == "ru", Question.published.is_(True)))
    ).scalar() or 0
    total_prog = (
        await session.execute(select(func.count(ProgTask.id)).where(ProgTask.published.is_(True)))
    ).scalar() or 0

    attempts_ids = [attempt.id for attempt, _ in rows]
    math_map: dict[int, int] = {}
    ru_map: dict[int, int] = {}
    prog_map: dict[int, int] = {}

    if attempts_ids:
        math_rows = (
            await session.execute(
                select(AttemptAnswer.attempt_id, func.count(AttemptAnswer.id))
                .join(Question, Question.id == AttemptAnswer.question_id)
                .where(
                    AttemptAnswer.attempt_id.in_(attempts_ids),
                    Question.subject == "math",
                    AttemptAnswer.answer_text.is_not(None),
                    AttemptAnswer.answer_text != "",
                )
                .group_by(AttemptAnswer.attempt_id)
            )
        ).all()
        math_map = {attempt_id: int(cnt) for attempt_id, cnt in math_rows}

        ru_rows = (
            await session.execute(
                select(AttemptAnswer.attempt_id, func.count(AttemptAnswer.id))
                .join(Question, Question.id == AttemptAnswer.question_id)
                .where(
                    AttemptAnswer.attempt_id.in_(attempts_ids),
                    Question.subject == "ru",
                    AttemptAnswer.answer_text.is_not(None),
                    AttemptAnswer.answer_text != "",
                )
                .group_by(AttemptAnswer.attempt_id)
            )
        ).all()
        ru_map = {attempt_id: int(cnt) for attempt_id, cnt in ru_rows}

        prog_rows = (
            await session.execute(
                select(AttemptProg.attempt_id, func.count(AttemptProg.id))
                .where(
                    AttemptProg.attempt_id.in_(attempts_ids),
                    AttemptProg.code.is_not(None),
                    AttemptProg.code != "",
                )
                .group_by(AttemptProg.attempt_id)
            )
        ).all()
        prog_map = {attempt_id: int(cnt) for attempt_id, cnt in prog_rows}

    total_all = int(total_math + total_ru + total_prog)
    out = []
    for attempt, user in rows:
        math_done = int(math_map.get(attempt.id, 0))
        ru_done = int(ru_map.get(attempt.id, 0))
        prog_done = int(prog_map.get(attempt.id, 0))
        completed = int(math_done + ru_done + prog_done)

        time_left_seconds = 0
        if attempt.status == "in_progress":
            time_left_seconds = max(0, int((attempt.ends_at - now).total_seconds()))

        out.append(
            {
                "attempt_id": attempt.id,
                "user_id": user.id,
                "email": user.email,
                "full_name": " ".join(
                    [part for part in [user.last_name, user.first_name, user.middle_name] if part]
                ) or user.email,
                "faculty": user.faculty,
                "status": attempt.status,
                "started_at": attempt.started_at,
                "ends_at": attempt.ends_at,
                "submitted_at": attempt.submitted_at,
                "score_total": attempt.score_total,
                "score_blocks": attempt.score_blocks or {},
                "progress": {
                    "math_done": math_done,
                    "math_total": int(total_math),
                    "ru_done": ru_done,
                    "ru_total": int(total_ru),
                    "prog_done": prog_done,
                    "prog_total": int(total_prog),
                    "completed": completed,
                    "total": total_all,
                },
                "time_left_seconds": time_left_seconds,
            }
        )
    return out
