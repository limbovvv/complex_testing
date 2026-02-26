from typing import Literal
from pydantic import BaseModel, Field
from datetime import datetime


class AnswerIn(BaseModel):
    answer_text: str | None = Field(default=None, max_length=255)


class DraftIn(BaseModel):
    language: Literal["python", "cpp", "node"]
    code: str = Field(max_length=100000)


class ExamStateOut(BaseModel):
    attempt_id: int
    variant_no: int
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
