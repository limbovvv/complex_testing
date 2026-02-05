from pydantic import BaseModel


class RegisterIn(BaseModel):
    last_name: str
    first_name: str
    middle_name: str | None = None
    phone: str
    faculty: str


class LoginIn(BaseModel):
    phone: str | None = None
    login: str | None = None
    password: str | None = None


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
