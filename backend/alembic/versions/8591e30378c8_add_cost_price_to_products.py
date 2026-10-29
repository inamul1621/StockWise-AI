"""add_cost_price_to_products

Revision ID: 8591e30378c8
Revises: 14a48bc540d6
Create Date: 2026-10-29 01:35:40.308475

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8591e30378c8'
down_revision: Union[str, Sequence[str], None] = '14a48bc540d6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('products', sa.Column('cost_price', sa.Numeric(precision=12, scale=2), server_default='0.00', nullable=False))
    op.create_check_constraint(
        'ck_products_cost_price_non_negative',
        'products',
        'cost_price >= 0'
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('ck_products_cost_price_non_negative', 'products', type_='check')
    op.drop_column('products', 'cost_price')
