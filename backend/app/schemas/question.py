from pydantic import BaseModel


class QuestionIn(BaseModel):
    subject: str
    question: str
    options: list[str]
    correct_index: int
    points: int = 1
    published: bool = False


class QuestionOut(BaseModel):
    id: int
    subject: str
    question: str
    options: list[str]
    points: int
    published: bool

    class Config:
        from_attributes = True
