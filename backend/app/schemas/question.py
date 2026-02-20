from pydantic import BaseModel


class QuestionIn(BaseModel):
    subject: str
    question: str
    options: list[str] | None = None
    correct_index: int | None = None
    correct_answer: str | None = None
    points: int = 1
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
