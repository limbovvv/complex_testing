from pydantic import BaseModel
from datetime import datetime


class AnswerIn(BaseModel):
    selected_index: int | None


class DraftIn(BaseModel):
    language: str
    code: str


class ExamStateOut(BaseModel):
    attempt_id: int
    status: str
    started_at: datetime
    ends_at: datetime
    math_questions: list
    ru_questions: list
    prog_tasks: list
    answers: dict
    drafts: dict


class ExamResultOut(BaseModel):
    attempt_id: int
    status: str
    score_total: int
    score_blocks: dict
    per_question: dict
    per_task: dict
