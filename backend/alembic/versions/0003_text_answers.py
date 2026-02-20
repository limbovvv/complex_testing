"""text answers for math and ru

Revision ID: 0003
Revises: 0002
Create Date: 2026-02-20
"""

from alembic import op
import sqlalchemy as sa


revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("questions", sa.Column("correct_answer", sa.String(length=255), nullable=True))
    op.add_column("attempt_answers", sa.Column("answer_text", sa.Text(), nullable=True))
    op.alter_column("questions", "options", existing_type=sa.JSON(), nullable=True)
    op.alter_column("questions", "correct_index", existing_type=sa.Integer(), nullable=True)

    # Fill correct_answer for existing single-choice questions when possible.
    op.execute(
        """
        UPDATE questions
        SET correct_answer = (options::jsonb ->> correct_index)
        WHERE correct_answer IS NULL
          AND options IS NOT NULL
          AND correct_index IS NOT NULL
        """
    )


def downgrade() -> None:
    op.alter_column("questions", "correct_index", existing_type=sa.Integer(), nullable=False)
    op.alter_column("questions", "options", existing_type=sa.JSON(), nullable=False)
    op.drop_column("attempt_answers", "answer_text")
    op.drop_column("questions", "correct_answer")
