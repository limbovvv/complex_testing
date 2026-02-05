"""add user profile fields

Revision ID: 0002
Revises: 0001
Create Date: 2026-02-05
"""

from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("last_name", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("first_name", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("middle_name", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("phone", sa.String(length=32), nullable=True))
    op.add_column("users", sa.Column("faculty", sa.String(length=255), nullable=True))
    op.create_unique_constraint("uq_users_phone", "users", ["phone"])


def downgrade() -> None:
    op.drop_constraint("uq_users_phone", "users", type_="unique")
    op.drop_column("users", "faculty")
    op.drop_column("users", "phone")
    op.drop_column("users", "middle_name")
    op.drop_column("users", "first_name")
    op.drop_column("users", "last_name")
