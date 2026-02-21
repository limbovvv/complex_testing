from pydantic import BaseModel, Field, model_validator


class RegisterIn(BaseModel):
    last_name: str = Field(min_length=1, max_length=100)
    first_name: str = Field(min_length=1, max_length=100)
    middle_name: str | None = Field(default=None, max_length=100)
    phone: str = Field(min_length=5, max_length=32)
    faculty: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=8, max_length=128)


class LoginIn(BaseModel):
    phone: str | None = Field(default=None, min_length=5, max_length=32)
    login: str | None = Field(default=None, min_length=1, max_length=255)
    password: str = Field(min_length=1, max_length=128)

    @model_validator(mode="after")
    def check_identity(self):
        if bool(self.phone) == bool(self.login):
            raise ValueError("Provide exactly one of phone or login")
        return self


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
