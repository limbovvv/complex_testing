from pydantic import BaseModel, Field


class ProgTaskIn(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    statement: str = Field(min_length=1, max_length=20000)
    points: int = Field(default=1, ge=1, le=100)
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
    task_id: int = Field(ge=1)
    input_data: str = Field(max_length=20000)
    output_data: str = Field(max_length=20000)
    is_hidden: bool = False


class ProgTestcaseOut(BaseModel):
    id: int
    task_id: int
    input_data: str
    output_data: str
    is_hidden: bool

    class Config:
        from_attributes = True
