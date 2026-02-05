from sqlalchemy import String, Integer, Boolean, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ProgTask(Base):
    __tablename__ = "prog_tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    statement: Mapped[str] = mapped_column(Text)
    points: Mapped[int] = mapped_column(Integer, default=1)
    published: Mapped[bool] = mapped_column(Boolean, default=False)

    testcases = relationship("ProgTestcase", back_populates="task", cascade="all, delete-orphan")


class ProgTestcase(Base):
    __tablename__ = "prog_testcases"

    id: Mapped[int] = mapped_column(primary_key=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("prog_tasks.id", ondelete="CASCADE"))
    input_data: Mapped[str] = mapped_column(Text)
    output_data: Mapped[str] = mapped_column(Text)
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False)

    task = relationship("ProgTask", back_populates="testcases")
