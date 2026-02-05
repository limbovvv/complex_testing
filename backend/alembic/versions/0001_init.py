"""init

Revision ID: 0001
Revises: 
Create Date: 2026-01-28
"""

from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "questions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("subject", sa.String(length=50), nullable=False),
        sa.Column("question", sa.String(length=2000), nullable=False),
        sa.Column("options", sa.JSON(), nullable=False),
        sa.Column("correct_index", sa.Integer(), nullable=False),
        sa.Column("points", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("published", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )

    op.create_table(
        "prog_tasks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("statement", sa.Text(), nullable=False),
        sa.Column("points", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("published", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )

    op.create_table(
        "prog_testcases",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("task_id", sa.Integer(), sa.ForeignKey("prog_tasks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("input_data", sa.Text(), nullable=False),
        sa.Column("output_data", sa.Text(), nullable=False),
        sa.Column("is_hidden", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )

    op.create_table(
        "exam_attempts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("score_total", sa.Integer(), nullable=True),
        sa.Column("score_blocks", sa.JSON(), nullable=True),
    )

    op.create_table(
        "attempt_answers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("attempt_id", sa.Integer(), sa.ForeignKey("exam_attempts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("question_id", sa.Integer(), sa.ForeignKey("questions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("selected_index", sa.Integer(), nullable=True),
        sa.Column("is_correct", sa.Boolean(), nullable=True),
    )

    op.create_table(
        "attempt_prog",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("attempt_id", sa.Integer(), sa.ForeignKey("exam_attempts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("task_id", sa.Integer(), sa.ForeignKey("prog_tasks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("language", sa.String(length=20), nullable=True),
        sa.Column("code", sa.Text(), nullable=True),
        sa.Column("verdicts", sa.JSON(), nullable=True),
        sa.Column("is_correct", sa.Boolean(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("attempt_prog")
    op.drop_table("attempt_answers")
    op.drop_table("exam_attempts")
    op.drop_table("prog_testcases")
    op.drop_table("prog_tasks")
    op.drop_table("questions")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
