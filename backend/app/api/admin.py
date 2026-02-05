from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_admin_user
from app.db.session import get_session
from app.models import Question, ProgTask, ProgTestcase, ExamAttempt, AttemptAnswer, AttemptProg, User
from app.schemas.question import QuestionIn, QuestionOut
from app.schemas.prog import ProgTaskIn, ProgTaskOut, ProgTestcaseIn, ProgTestcaseOut

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/questions", response_model=list[QuestionOut])
async def list_questions(session: AsyncSession = Depends(get_session), _: str = Depends(get_admin_user)):
    res = await session.execute(select(Question))
    return res.scalars().all()


@router.post("/questions", response_model=QuestionOut)
async def create_question(data: QuestionIn, session: AsyncSession = Depends(get_session), _: str = Depends(get_admin_user)):
    q = Question(**data.model_dump())
    session.add(q)
    await session.commit()
    await session.refresh(q)
    return q


@router.put("/questions/{question_id}", response_model=QuestionOut)
async def update_question(question_id: int, data: QuestionIn, session: AsyncSession = Depends(get_session), _: str = Depends(get_admin_user)):
    res = await session.execute(select(Question).where(Question.id == question_id))
    q = res.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in data.model_dump().items():
        setattr(q, k, v)
    await session.commit()
    await session.refresh(q)
    return q


@router.delete("/questions/{question_id}")
async def delete_question(question_id: int, session: AsyncSession = Depends(get_session), _: str = Depends(get_admin_user)):
    res = await session.execute(select(Question).where(Question.id == question_id))
    q = res.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Not found")
    await session.delete(q)
    await session.commit()
    return {"status": "deleted"}


@router.get("/prog_tasks", response_model=list[ProgTaskOut])
async def list_tasks(session: AsyncSession = Depends(get_session), _: str = Depends(get_admin_user)):
    res = await session.execute(select(ProgTask))
    return res.scalars().all()


@router.post("/prog_tasks", response_model=ProgTaskOut)
async def create_task(data: ProgTaskIn, session: AsyncSession = Depends(get_session), _: str = Depends(get_admin_user)):
    t = ProgTask(**data.model_dump())
    session.add(t)
    await session.commit()
    await session.refresh(t)
    return t


@router.put("/prog_tasks/{task_id}", response_model=ProgTaskOut)
async def update_task(task_id: int, data: ProgTaskIn, session: AsyncSession = Depends(get_session), _: str = Depends(get_admin_user)):
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
async def delete_task(task_id: int, session: AsyncSession = Depends(get_session), _: str = Depends(get_admin_user)):
    res = await session.execute(select(ProgTask).where(ProgTask.id == task_id))
    t = res.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Not found")
    await session.delete(t)
    await session.commit()
    return {"status": "deleted"}


@router.get("/prog_testcases", response_model=list[ProgTestcaseOut])
async def list_testcases(session: AsyncSession = Depends(get_session), _: str = Depends(get_admin_user)):
    res = await session.execute(select(ProgTestcase))
    return res.scalars().all()


@router.post("/prog_testcases", response_model=ProgTestcaseOut)
async def create_testcase(data: ProgTestcaseIn, session: AsyncSession = Depends(get_session), _: str = Depends(get_admin_user)):
    t = ProgTestcase(**data.model_dump())
    session.add(t)
    await session.commit()
    await session.refresh(t)
    return t


@router.put("/prog_testcases/{testcase_id}", response_model=ProgTestcaseOut)
async def update_testcase(testcase_id: int, data: ProgTestcaseIn, session: AsyncSession = Depends(get_session), _: str = Depends(get_admin_user)):
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
async def delete_testcase(testcase_id: int, session: AsyncSession = Depends(get_session), _: str = Depends(get_admin_user)):
    res = await session.execute(select(ProgTestcase).where(ProgTestcase.id == testcase_id))
    t = res.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Not found")
    await session.delete(t)
    await session.commit()
    return {"status": "deleted"}


@router.post("/publish/{entity}/{entity_id}")
async def publish_entity(entity: str, entity_id: int, session: AsyncSession = Depends(get_session), _: str = Depends(get_admin_user)):
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
async def stats(session: AsyncSession = Depends(get_session), _: str = Depends(get_admin_user)):
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
async def attempts(session: AsyncSession = Depends(get_session), _: str = Depends(get_admin_user)):
    res = await session.execute(
        select(ExamAttempt, User)
        .join(User, User.id == ExamAttempt.user_id)
        .order_by(ExamAttempt.id.desc())
    )
    rows = res.all()
    return [
        {
            "attempt_id": attempt.id,
            "user_id": user.id,
            "email": user.email,
            "status": attempt.status,
            "started_at": attempt.started_at,
            "ends_at": attempt.ends_at,
            "submitted_at": attempt.submitted_at,
            "score_total": attempt.score_total,
            "score_blocks": attempt.score_blocks or {},
        }
        for attempt, user in rows
    ]
