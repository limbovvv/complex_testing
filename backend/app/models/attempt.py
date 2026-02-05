from sqlalchemy import ForeignKey, DateTime, String, Integer, Boolean, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from app.db.base import Base


class ExamAttempt(Base):
    __tablename__ = "exam_attempts"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    status: Mapped[str] = mapped_column(String(20), default="in_progress")
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    score_total: Mapped[int | None] = mapped_column(Integer, nullable=True)
    score_blocks: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    user = relationship("User", back_populates="attempts")
    answers = relationship("AttemptAnswer", back_populates="attempt", cascade="all, delete-orphan")
    prog_answers = relationship("AttemptProg", back_populates="attempt", cascade="all, delete-orphan")


class AttemptAnswer(Base):
    __tablename__ = "attempt_answers"

    id: Mapped[int] = mapped_column(primary_key=True)
    attempt_id: Mapped[int] = mapped_column(ForeignKey("exam_attempts.id", ondelete="CASCADE"))
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id", ondelete="CASCADE"))
    selected_index: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_correct: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    attempt = relationship("ExamAttempt", back_populates="answers")


class AttemptProg(Base):
    __tablename__ = "attempt_prog"

    id: Mapped[int] = mapped_column(primary_key=True)
    attempt_id: Mapped[int] = mapped_column(ForeignKey("exam_attempts.id", ondelete="CASCADE"))
    task_id: Mapped[int] = mapped_column(ForeignKey("prog_tasks.id", ondelete="CASCADE"))
    language: Mapped[str | None] = mapped_column(String(20), nullable=True)
    code: Mapped[str | None] = mapped_column(Text, nullable=True)
    verdicts: Mapped[list | None] = mapped_column(JSON, nullable=True)
    is_correct: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    attempt = relationship("ExamAttempt", back_populates="prog_answers")
