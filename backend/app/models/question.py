from sqlalchemy import String, Integer, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(primary_key=True)
    subject: Mapped[str] = mapped_column(String(50), index=True)
    question: Mapped[str] = mapped_column(String(2000))
    options: Mapped[list] = mapped_column(JSON)
    correct_index: Mapped[int] = mapped_column(Integer)
    points: Mapped[int] = mapped_column(Integer, default=1)
    published: Mapped[bool] = mapped_column(Boolean, default=False)
