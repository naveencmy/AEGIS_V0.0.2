"""Initial schema with pgvector, tsvector, and tables

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-08-30 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import pgvector

# revision identifiers, used by Alembic.
revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Extensions
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    op.execute('CREATE EXTENSION IF NOT EXISTS "vector"')
    op.execute('CREATE EXTENSION IF NOT EXISTS "pg_trgm"')
    op.execute('CREATE EXTENSION IF NOT EXISTS "unaccent"')

    # 2. Trigger function for TSVector
    op.execute("""
        CREATE OR REPLACE FUNCTION update_framework_tsv()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.tsv := 
            setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
            setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
            setweight(to_tsvector('english', COALESCE(NEW.guidance, '')), 'C');
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)

    # 3. Tables
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('username', sa.String(length=100), nullable=False, unique=True),
        sa.Column('email', sa.String(length=255), nullable=False, unique=True),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False, server_default='auditor'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'framework_controls',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('framework', sa.String(length=50), nullable=False),
        sa.Column('control_id', sa.String(length=50), nullable=False),
        sa.Column('title', sa.Text(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('guidance', sa.Text(), nullable=True),
        sa.Column('severity', sa.String(length=20), nullable=False, server_default='Medium'),
        sa.Column('embedding', pgvector.sqlalchemy.Vector(dim=1024), nullable=True),
        sa.Column('tsv', postgresql.TSVECTOR(), nullable=True),
        sa.Column('source_url', sa.Text(), nullable=True),
        sa.Column('source_page', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_index('idx_framework_controls_framework', 'framework_controls', ['framework'])
    op.create_index('idx_framework_controls_control_id', 'framework_controls', ['control_id'])
    op.create_index('idx_framework_control_framework_id', 'framework_controls', ['framework', 'control_id'], unique=True)
    op.create_index('idx_framework_controls_tsv', 'framework_controls', ['tsv'], postgresql_using='gin')
    
    # HNSW Index for vector search
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_framework_controls_embedding_hnsw 
        ON framework_controls 
        USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64);
    """)

    # Trigger for TSVector
    op.execute("""
        CREATE TRIGGER trg_framework_tsv_update
        BEFORE INSERT OR UPDATE ON framework_controls
        FOR EACH ROW EXECUTE FUNCTION update_framework_tsv();
    """)

    op.create_table(
        'device_configs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('device_name', sa.String(length=255), nullable=False),
        sa.Column('vendor', sa.String(length=50), nullable=False),
        sa.Column('device_type', sa.String(length=50), nullable=False, server_default='firewall'),
        sa.Column('raw_config', sa.Text(), nullable=False),
        sa.Column('parsed_rules', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('idx_device_configs_vendor', 'device_configs', ['vendor'])

    op.create_table(
        'audit_jobs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('device_config_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('device_configs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('framework_filter', postgresql.ARRAY(sa.String(length=50)), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='queued'),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('total_findings', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('critical_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('high_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('medium_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('low_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('compliance_score_percent', sa.Float(), nullable=False, server_default='100.0'),
    )

    op.create_table(
        'audit_findings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('audit_job_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('audit_jobs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('control_id', sa.String(length=50), nullable=False),
        sa.Column('framework', sa.String(length=50), nullable=False),
        sa.Column('severity', sa.String(length=20), nullable=False),
        sa.Column('finding_title', sa.Text(), nullable=False),
        sa.Column('finding_description', sa.Text(), nullable=False),
        sa.Column('device_rule_reference', sa.Text(), nullable=True),
        sa.Column('remediation', sa.Text(), nullable=True),
        sa.Column('citation_source', sa.Text(), nullable=False),
        sa.Column('citation_section', sa.Text(), nullable=True),
        sa.Column('citation_url', sa.Text(), nullable=True),
        sa.Column('citation_page', sa.Integer(), nullable=True),
        sa.Column('confidence_score', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('llm_raw_response', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('idx_audit_findings_job_id', 'audit_findings', ['audit_job_id'])
    op.create_index('idx_audit_findings_control_id', 'audit_findings', ['control_id'])
    op.create_index('idx_audit_findings_framework', 'audit_findings', ['framework'])

    op.create_table(
        'job_queue',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('job_type', sa.String(length=50), nullable=False),
        sa.Column('payload', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('locked_by', sa.String(length=100), nullable=True),
        sa.Column('locked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('attempts', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('max_attempts', sa.Integer(), nullable=False, server_default='3'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('idx_job_queue_status', 'job_queue', ['status'])
    op.execute("CREATE INDEX idx_job_queue_pending ON job_queue (status) WHERE status = 'pending';")


def downgrade() -> None:
    op.drop_table('job_queue')
    op.drop_table('audit_findings')
    op.drop_table('audit_jobs')
    op.drop_table('device_configs')
    op.drop_table('framework_controls')
    op.drop_table('users')
    op.execute('DROP FUNCTION IF EXISTS update_framework_tsv() CASCADE;')
