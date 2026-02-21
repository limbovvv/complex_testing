"""single attempt per user

Revision ID: 0004
Revises: 0003
Create Date: 2026-02-21
"""

from alembic import op
import sqlalchemy as sa


revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Keep the latest attempt per user if duplicates exist.
    op.execute(
        """
        DELETE FROM exam_attempts
        WHERE id IN (
            SELECT id
            FROM (
                SELECT id,
                       ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY id DESC) AS rn
                FROM exam_attempts
            ) t
            WHERE t.rn > 1
        )
        """
    )

    op.create_index("ix_exam_attempts_user_id", "exam_attempts", ["user_id"], unique=False)
    op.create_unique_constraint("uq_exam_attempts_user_id", "exam_attempts", ["user_id"])


def downgrade() -> None:
    op.drop_constraint("uq_exam_attempts_user_id", "exam_attempts", type_="unique")
    op.drop_index("ix_exam_attempts_user_id", table_name="exam_attempts")
