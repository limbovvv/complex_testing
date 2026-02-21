from typing import Literal
from pydantic import BaseModel, Field


class QuestionIn(BaseModel):
    subject: Literal["math", "ru"]
    question: str = Field(min_length=1, max_length=2000)
    options: list[str] | None = None
    correct_index: int | None = None
    correct_answer: str | None = Field(default=None, max_length=255)
    points: int = Field(default=1, ge=1, le=100)
    published: bool = False


class QuestionOut(BaseModel):
    id: int
    subject: str
    question: str
    options: list[str] | None = None
    correct_answer: str | None = None
    points: int
    published: bool

    class Config:
        from_attributes = True
