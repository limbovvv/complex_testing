from sqlalchemy import String, Integer, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(primary_key=True)
    subject: Mapped[str] = mapped_column(String(50), index=True)
    question: Mapped[str] = mapped_column(String(2000))
    options: Mapped[list | None] = mapped_column(JSON, nullable=True)
    correct_index: Mapped[int | None] = mapped_column(Integer, nullable=True)
    correct_answer: Mapped[str | None] = mapped_column(String(255), nullable=True)
    points: Mapped[int] = mapped_column(Integer, default=1)
    published: Mapped[bool] = mapped_column(Boolean, default=False)
