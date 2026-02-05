from pydantic import BaseModel


class ProgTaskIn(BaseModel):
    title: str
    statement: str
    points: int = 1
    published: bool = False


class ProgTaskOut(BaseModel):
    id: int
    title: str
    statement: str
    points: int
    published: bool

    class Config:
        from_attributes = True


class ProgTestcaseIn(BaseModel):
    task_id: int
    input_data: str
    output_data: str
    is_hidden: bool = False


class ProgTestcaseOut(BaseModel):
    id: int
    task_id: int
    input_data: str
    output_data: str
    is_hidden: bool

    class Config:
        from_attributes = True
