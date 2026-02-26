"""add variants to attempts/questions/tasks

Revision ID: 0005
Revises: 0004
Create Date: 2026-02-26
"""

from alembic import op
import sqlalchemy as sa


revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("questions", sa.Column("variant_no", sa.Integer(), nullable=False, server_default="1"))
    op.add_column("prog_tasks", sa.Column("variant_no", sa.Integer(), nullable=False, server_default="1"))
    op.add_column("exam_attempts", sa.Column("variant_no", sa.Integer(), nullable=False, server_default="1"))

    op.create_index("ix_questions_variant_no", "questions", ["variant_no"], unique=False)
    op.create_index("ix_prog_tasks_variant_no", "prog_tasks", ["variant_no"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_prog_tasks_variant_no", table_name="prog_tasks")
    op.drop_index("ix_questions_variant_no", table_name="questions")

    op.drop_column("exam_attempts", "variant_no")
    op.drop_column("prog_tasks", "variant_no")
    op.drop_column("questions", "variant_no")
