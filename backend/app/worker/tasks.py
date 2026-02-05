import asyncio
from datetime import datetime, timezone
from sqlalchemy import select

from app.worker.celery_app import celery_app
from app.db.session import AsyncSessionLocal
from app.models import ExamAttempt, AttemptAnswer, AttemptProg, Question, ProgTask, ProgTestcase
from app.judge.sandbox import run_task_in_sandbox


def _run(coro):
    return asyncio.run(coro)


@celery_app.task(name="grade_attempt")
def grade_attempt(attempt_id: int):
    _run(_grade_attempt(attempt_id))


@celery_app.task(name="auto_submit_expired")
def auto_submit_expired():
    _run(_auto_submit_expired())


async def _auto_submit_expired():
    async with AsyncSessionLocal() as session:
        now = datetime.now(timezone.utc)
        res = await session.execute(
            select(ExamAttempt).where(ExamAttempt.status == "in_progress", ExamAttempt.ends_at < now)
        )
        attempts = res.scalars().all()
        for attempt in attempts:
            attempt.status = "timed_out"
            attempt.submitted_at = now
            await session.commit()
            grade_attempt.delay(attempt.id)


async def _grade_attempt(attempt_id: int):
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(ExamAttempt).where(ExamAttempt.id == attempt_id))
        attempt = res.scalar_one_or_none()
        if not attempt:
            return

        score_math = 0
        score_ru = 0
        score_prog = 0

        res_ans = await session.execute(select(AttemptAnswer).where(AttemptAnswer.attempt_id == attempt.id))
        answers = res_ans.scalars().all()
        q_map = {}
        if answers:
            q_ids = [a.question_id for a in answers]
            res_q = await session.execute(select(Question).where(Question.id.in_(q_ids)))
            for q in res_q.scalars().all():
                q_map[q.id] = q

        for ans in answers:
            q = q_map.get(ans.question_id)
            if not q:
                continue
            is_correct = ans.selected_index is not None and ans.selected_index == q.correct_index
            ans.is_correct = is_correct
            if is_correct:
                if q.subject == "math":
                    score_math += q.points
                elif q.subject == "ru":
                    score_ru += q.points

        res_prog = await session.execute(select(AttemptProg).where(AttemptProg.attempt_id == attempt.id))
        drafts = res_prog.scalars().all()
        task_map = {}
        if drafts:
            t_ids = [d.task_id for d in drafts]
            res_t = await session.execute(select(ProgTask).where(ProgTask.id.in_(t_ids)))
            for t in res_t.scalars().all():
                task_map[t.id] = t

        for draft in drafts:
            task = task_map.get(draft.task_id)
            if not task or not draft.code or not draft.language:
                draft.is_correct = False
                draft.verdicts = []
                continue

            res_tc = await session.execute(select(ProgTestcase).where(ProgTestcase.task_id == task.id))
            testcases = res_tc.scalars().all()
            pairs = [(tc.input_data, tc.output_data) for tc in testcases]
            verdicts, all_ok = run_task_in_sandbox(draft.language, draft.code, pairs)
            draft.verdicts = verdicts
            draft.is_correct = all_ok
            if all_ok:
                score_prog += task.points

        attempt.score_total = score_math + score_ru + score_prog
        attempt.score_blocks = {"math": score_math, "ru": score_ru, "prog": score_prog}
        await session.commit()
