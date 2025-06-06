"""Message modeline is_read eklendi

Revision ID: 6b328b169a4e
Revises: 6e02c0b56dfa
Create Date: 2025-05-01 04:33:37.955700

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6b328b169a4e'
down_revision = '6e02c0b56dfa'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('message', schema=None) as batch_op:
        batch_op.add_column(sa.Column('is_read', sa.Boolean(), nullable=True))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('message', schema=None) as batch_op:
        batch_op.drop_column('is_read')

    # ### end Alembic commands ###
