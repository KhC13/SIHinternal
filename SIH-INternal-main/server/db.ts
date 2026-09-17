import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import path from 'path';
import fs from 'fs';

const { Pool } = pg;

// Determine whether we connect to an external PostgreSQL instance or embedded PostgreSQL (PGlite)
let poolClient: pg.Pool | null = null;
let pgliteClient: PGlite | null = null;
let isInitialized = false;

export async function getDb() {
  if (isInitialized && (poolClient || pgliteClient)) {
    return { pool: poolClient, pglite: pgliteClient };
  }

  const databaseUrl = process.env.DATABASE_URL;
  // If DATABASE_URL is provided and not pointing to default localhost where postgres isn't running
  const shouldUsePool = databaseUrl && !databaseUrl.includes('localhost:5432/innoprocure');

  if (shouldUsePool) {
    try {
      console.log('Connecting to PostgreSQL via connection pool:', databaseUrl.split('@')[1] || 'URL provided');
      poolClient = new Pool({
        connectionString: databaseUrl,
        ssl: databaseUrl.includes('supabase') || databaseUrl.includes('neon') || databaseUrl.includes('railway')
          ? { rejectUnauthorized: false }
          : undefined,
        max: 10,
      });
      // Test connection
      await poolClient.query('SELECT 1');
      console.log('PostgreSQL connection pool connected successfully.');
    } catch (err) {
      console.warn('PostgreSQL external pool connection failed. Falling back to embedded PostgreSQL (PGlite):', (err as Error).message);
      poolClient = null;
    }
  }

  if (!poolClient) {
    const dataDir = path.resolve(process.cwd(), 'data', 'postgres_db');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    try {
      console.log('Initializing embedded PostgreSQL engine at:', dataDir);
      pgliteClient = new PGlite(dataDir);
      await pgliteClient.waitReady;
      console.log('Embedded PostgreSQL engine ready.');
    } catch (diskErr) {
      console.warn('PGlite disk-backed initialization failed; retrying in-memory fallback to recover the app state.', (diskErr as Error).message);

      try {
        fs.rmSync(dataDir, { recursive: true, force: true });
        fs.mkdirSync(dataDir, { recursive: true });
        pgliteClient = new PGlite();
        await pgliteClient.waitReady;
        console.log('Embedded PostgreSQL engine recovered in memory fallback mode.');
      } catch (fallbackErr) {
        console.error('PGlite initialization failed in both disk and memory modes.', fallbackErr);
        throw fallbackErr;
      }
    }
  }

  isInitialized = true;
  return { pool: poolClient, pglite: pgliteClient };
}

export async function query<T = any>(text: string, params: any[] = []): Promise<{ rows: T[]; rowCount: number }> {
  const { pool, pglite } = await getDb();
  if (pool) {
    const res = await pool.query(text, params);
    return { rows: res.rows as T[], rowCount: res.rowCount ?? res.rows.length };
  } else if (pglite) {
    // PGlite expects params formatted
    const res = await pglite.query<T>(text, params);
    return { rows: res.rows, rowCount: res.rows.length };
  }
  throw new Error('Database not initialized');
}

export async function exec(text: string): Promise<void> {
  const { pool, pglite } = await getDb();
  if (pool) {
    await pool.query(text);
  } else if (pglite) {
    await pglite.exec(text);
  }
}

export async function withTransaction<T>(fn: (client: { query: typeof query }) => Promise<T>): Promise<T> {
  await query('BEGIN');
  try {
    const result = await fn({ query });
    await query('COMMIT');
    return result;
  } catch (err) {
    await query('ROLLBACK');
    throw err;
  }
}

export async function initDatabaseSchema() {
  console.log('Initializing database schema and checking tables...');
  
  await exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      ministry TEXT NOT NULL,
      description TEXT NOT NULL,
      location TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      active_problems_count INTEGER DEFAULT 0,
      pilots_count INTEGER DEFAULT 0,
      total_procurement_value DOUBLE PRECISION DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS startups (
      id TEXT PRIMARY KEY,
      company_name TEXT UNIQUE NOT NULL,
      registration_number TEXT UNIQUE NOT NULL,
      founded_year INTEGER NOT NULL,
      stage TEXT NOT NULL,
      team_size INTEGER NOT NULL,
      funding_total DOUBLE PRECISION DEFAULT 0,
      location TEXT NOT NULL,
      website TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      description TEXT NOT NULL,
      pitch_summary TEXT NOT NULL,
      previous_gov_experience BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS startup_technologies (
      id TEXT PRIMARY KEY,
      startup_id TEXT NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS startup_sectors (
      id TEXT PRIMARY KEY,
      startup_id TEXT NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS startup_projects (
      id TEXT PRIMARY KEY,
      startup_id TEXT NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      client TEXT NOT NULL,
      description TEXT NOT NULL,
      year INTEGER NOT NULL,
      outcome_url TEXT
    );

    CREATE TABLE IF NOT EXISTS startup_certifications (
      id TEXT PRIMARY KEY,
      startup_id TEXT NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      issuing_body TEXT NOT NULL,
      year INTEGER NOT NULL,
      valid_until TEXT
    );

    CREATE TABLE IF NOT EXISTS startup_documents (
      id TEXT PRIMARY KEY,
      startup_id TEXT NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      uploaded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'STARTUP',
      department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
      startup_id TEXT REFERENCES startups(id) ON DELETE SET NULL,
      designation TEXT,
      phone TEXT,
      avatar_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS problem_statements (
      id TEXT PRIMARY KEY,
      problem_code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
      sector TEXT NOT NULL,
      location TEXT NOT NULL,
      budget DOUBLE PRECISION NOT NULL,
      timeline_months INTEGER NOT NULL,
      expected_impact TEXT NOT NULL,
      target_beneficiaries TEXT NOT NULL,
      evaluation_criteria JSONB,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      published_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS problem_requirements (
      id TEXT PRIMARY KEY,
      problem_id TEXT NOT NULL REFERENCES problem_statements(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      is_mandatory BOOLEAN DEFAULT true
    );

    CREATE TABLE IF NOT EXISTS problem_technologies (
      id TEXT PRIMARY KEY,
      problem_id TEXT NOT NULL REFERENCES problem_statements(id) ON DELETE CASCADE,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      problem_id TEXT NOT NULL REFERENCES problem_statements(id) ON DELETE CASCADE,
      startup_id TEXT NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
      proposal_title TEXT NOT NULL,
      technical_approach TEXT NOT NULL,
      implementation_plan TEXT NOT NULL,
      timeline_months INTEGER NOT NULL,
      proposed_budget DOUBLE PRECISION NOT NULL,
      expected_impact TEXT NOT NULL,
      team_details TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'SUBMITTED',
      submitted_at TIMESTAMPTZ DEFAULT NOW(),
      shortlisted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(problem_id, startup_id)
    );

    CREATE TABLE IF NOT EXISTS application_documents (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS ai_matches (
      id TEXT PRIMARY KEY,
      problem_id TEXT NOT NULL REFERENCES problem_statements(id) ON DELETE CASCADE,
      startup_id TEXT NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
      overall_score DOUBLE PRECISION NOT NULL,
      technology_score DOUBLE PRECISION NOT NULL,
      sector_score DOUBLE PRECISION NOT NULL,
      requirement_score DOUBLE PRECISION NOT NULL,
      experience_score DOUBLE PRECISION NOT NULL,
      budget_fit_score DOUBLE PRECISION NOT NULL,
      location_fit_score DOUBLE PRECISION NOT NULL,
      impact_potential_score DOUBLE PRECISION NOT NULL,
      match_explanation TEXT NOT NULL,
      strengths JSONB,
      potential_risks JSONB,
      recommended_next_step TEXT NOT NULL,
      is_fallback BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(problem_id, startup_id)
    );

    CREATE TABLE IF NOT EXISTS evaluation_weights (
      id TEXT PRIMARY KEY,
      problem_id TEXT UNIQUE NOT NULL REFERENCES problem_statements(id) ON DELETE CASCADE,
      technical INTEGER DEFAULT 20,
      innovation INTEGER DEFAULT 15,
      feasibility INTEGER DEFAULT 15,
      financial INTEGER DEFAULT 10,
      scalability INTEGER DEFAULT 10,
      impact INTEGER DEFAULT 15,
      security INTEGER DEFAULT 5,
      compliance INTEGER DEFAULT 10,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS evaluations (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      evaluator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      technical_score DOUBLE PRECISION NOT NULL,
      innovation_score DOUBLE PRECISION NOT NULL,
      feasibility_score DOUBLE PRECISION NOT NULL,
      financial_score DOUBLE PRECISION NOT NULL,
      scalability_score DOUBLE PRECISION NOT NULL,
      impact_score DOUBLE PRECISION NOT NULL,
      security_score DOUBLE PRECISION NOT NULL,
      compliance_score DOUBLE PRECISION NOT NULL,
      total_weighted_score DOUBLE PRECISION NOT NULL,
      comments TEXT NOT NULL,
      status TEXT DEFAULT 'SUBMITTED',
      submitted_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS pilots (
      id TEXT PRIMARY KEY,
      application_id TEXT UNIQUE NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      problem_id TEXT NOT NULL REFERENCES problem_statements(id) ON DELETE CASCADE,
      startup_id TEXT NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
      department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      objectives TEXT NOT NULL,
      expected_outcomes TEXT NOT NULL,
      budget DOUBLE PRECISION NOT NULL,
      start_date TIMESTAMPTZ NOT NULL,
      end_date TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL DEFAULT 'PLANNED',
      completion_percentage INTEGER DEFAULT 0,
      scale_readiness_score DOUBLE PRECISION,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS pilot_milestones (
      id TEXT PRIMARY KEY,
      pilot_id TEXT NOT NULL REFERENCES pilots(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      due_date TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      completion_percentage INTEGER DEFAULT 0,
      owner TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS pilot_kpis (
      id TEXT PRIMARY KEY,
      pilot_id TEXT NOT NULL REFERENCES pilots(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      metric_unit TEXT NOT NULL,
      baseline_value DOUBLE PRECISION NOT NULL,
      target_value DOUBLE PRECISION NOT NULL,
      current_value DOUBLE PRECISION NOT NULL,
      status TEXT NOT NULL DEFAULT 'ON_TRACK',
      trend TEXT NOT NULL DEFAULT 'UP',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS pilot_risks (
      id TEXT PRIMARY KEY,
      pilot_id TEXT NOT NULL REFERENCES pilots(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'MEDIUM',
      probability TEXT NOT NULL DEFAULT 'LOW',
      mitigation TEXT NOT NULL,
      owner TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'IDENTIFIED',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS procurements (
      id TEXT PRIMARY KEY,
      pilot_id TEXT REFERENCES pilots(id) ON DELETE SET NULL,
      problem_id TEXT NOT NULL REFERENCES problem_statements(id) ON DELETE CASCADE,
      startup_id TEXT NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
      department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      estimated_value DOUBLE PRECISION NOT NULL,
      approved_budget DOUBLE PRECISION NOT NULL,
      current_stage TEXT NOT NULL DEFAULT 'RECOMMENDATION',
      procurement_officer_id TEXT,
      target_completion_date TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS procurement_events (
      id TEXT PRIMARY KEY,
      procurement_id TEXT NOT NULL REFERENCES procurements(id) ON DELETE CASCADE,
      from_stage TEXT NOT NULL,
      to_stage TEXT NOT NULL,
      notes TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id TEXT PRIMARY KEY,
      procurement_id TEXT NOT NULL REFERENCES procurements(id) ON DELETE CASCADE,
      contract_number TEXT UNIQUE NOT NULL,
      startup_id TEXT NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
      department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
      start_date TIMESTAMPTZ NOT NULL,
      end_date TIMESTAMPTZ NOT NULL,
      contract_value DOUBLE PRECISION NOT NULL,
      terms TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      document_url TEXT,
      signed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS scale_assessments (
      id TEXT PRIMARY KEY,
      pilot_id TEXT UNIQUE NOT NULL REFERENCES pilots(id) ON DELETE CASCADE,
      impact_score DOUBLE PRECISION NOT NULL,
      technical_readiness_score DOUBLE PRECISION NOT NULL,
      operational_readiness_score DOUBLE PRECISION NOT NULL,
      financial_sustainability_score DOUBLE PRECISION NOT NULL,
      user_adoption_score DOUBLE PRECISION NOT NULL,
      security_score DOUBLE PRECISION NOT NULL,
      compliance_score DOUBLE PRECISION NOT NULL,
      scalability_score DOUBLE PRECISION NOT NULL,
      overall_score DOUBLE PRECISION NOT NULL,
      readiness_level TEXT NOT NULL,
      summary TEXT NOT NULL,
      recommendations JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      role TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT,
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      user_email TEXT,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      metadata JSONB,
      ip_address TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      path TEXT NOT NULL,
      uploader_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  console.log('PostgreSQL tables initialized successfully.');
}
