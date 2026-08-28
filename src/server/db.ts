import pg from 'pg';

const { Pool } = pg;

export interface DbStatus {
  connected: boolean;
  type: 'postgres' | 'local_storage';
  host?: string;
  database?: string;
  tableCount?: number;
  message?: string;
}

let pool: pg.Pool | null = null;
let isInitialized = false;

export function getPgPool(): pg.Pool | null {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  const host = process.env.POSTGRES_HOST;
  const user = process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD;
  const database = process.env.POSTGRES_DB || 'brainboss';
  const port = parseInt(process.env.POSTGRES_PORT || '5432', 10);

  if (connectionString) {
    pool = new Pool({
      connectionString,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    return pool;
  }

  if (host && user) {
    pool = new Pool({
      host,
      user,
      password,
      database,
      port,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    return pool;
  }

  return null;
}

export async function initDatabase(): Promise<boolean> {
  const p = getPgPool();
  if (!p) {
    console.log('ℹ️  No DATABASE_URL or POSTGRES_* configuration detected. Using local storage fallback.');
    return false;
  }

  try {
    const client = await p.connect();
    try {
      await client.query('BEGIN');

      // 1. Settings / Configuration table (Parent config, player state, system metadata)
      await client.query(`
        CREATE TABLE IF NOT EXISTS brainboss_settings (
          key VARCHAR(128) PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 2. Custom Questions & AI-generated questions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS brainboss_custom_questions (
          id VARCHAR(128) PRIMARY KEY,
          data JSONB NOT NULL,
          subject VARCHAR(64),
          grade_level VARCHAR(64),
          school_grade INT,
          assigned_kid_id VARCHAR(128),
          scan_batch_id VARCHAR(128),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 3. Scanned Schoolbook / Exam Batches table
      await client.query(`
        CREATE TABLE IF NOT EXISTS brainboss_scanned_batches (
          id VARCHAR(128) PRIMARY KEY,
          data JSONB NOT NULL,
          assigned_kid_id VARCHAR(128),
          subject VARCHAR(64),
          school_grade INT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 4. Session / Player Activity Log table
      await client.query(`
        CREATE TABLE IF NOT EXISTS brainboss_activity_logs (
          id SERIAL PRIMARY KEY,
          kid_id VARCHAR(128),
          activity_type VARCHAR(64),
          details JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query('COMMIT');
      isInitialized = true;
      console.log('✅ PostgreSQL database connected and tables initialized successfully.');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('❌ Failed to initialize PostgreSQL tables:', err);
      return false;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('⚠️ Could not connect to PostgreSQL:', err?.message || err);
    return false;
  }
}

export async function checkDbStatus(): Promise<DbStatus> {
  const p = getPgPool();
  if (!p) {
    return {
      connected: false,
      type: 'local_storage',
      message: 'No DATABASE_URL configured. Running in client-side / local storage mode.',
    };
  }

  try {
    const res = await p.query('SELECT current_database() as db, inet_server_addr() as host, count(*) as tables FROM information_schema.tables WHERE table_schema = $1', ['public']);
    const row = res.rows[0];
    return {
      connected: true,
      type: 'postgres',
      database: row?.db,
      host: row?.host || 'configured',
      tableCount: parseInt(row?.tables || '0', 10),
      message: 'PostgreSQL database connected and operational.',
    };
  } catch (err: any) {
    return {
      connected: false,
      type: 'postgres',
      message: `PostgreSQL connection error: ${err.message}`,
    };
  }
}

export async function getRemoteData() {
  const p = getPgPool();
  if (!p) return null;

  try {
    // Load settings
    const settingsRes = await p.query('SELECT key, data FROM brainboss_settings');
    const settingsMap: Record<string, any> = {};
    for (const r of settingsRes.rows) {
      settingsMap[r.key] = r.data;
    }

    // Load custom questions
    const questionsRes = await p.query('SELECT data FROM brainboss_custom_questions ORDER BY created_at DESC');
    const customQuestions = questionsRes.rows.map((r) => r.data);

    // Load scanned batches
    const batchesRes = await p.query('SELECT data FROM brainboss_scanned_batches ORDER BY created_at DESC');
    const scannedBatches = batchesRes.rows.map((r) => r.data);

    return {
      parentConfig: settingsMap['parent_config'] || null,
      customQuestions,
      scannedBatches,
    };
  } catch (err) {
    console.error('Error fetching remote data from PostgreSQL:', err);
    return null;
  }
}

export async function syncPushData(payload: {
  parentConfig?: any;
  customQuestions?: any[];
  scannedBatches?: any[];
}) {
  const p = getPgPool();
  if (!p) return null;

  const client = await p.connect();
  try {
    await client.query('BEGIN');

    // 1. Sync Parent Config
    if (payload.parentConfig) {
      await client.query(
        `INSERT INTO brainboss_settings (key, data, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP`,
        ['parent_config', JSON.stringify(payload.parentConfig)]
      );
    }

    // 2. Sync Custom Questions
    if (Array.isArray(payload.customQuestions)) {
      for (const q of payload.customQuestions) {
        if (!q || !q.id) continue;
        await client.query(
          `INSERT INTO brainboss_custom_questions (id, data, subject, grade_level, school_grade, assigned_kid_id, scan_batch_id, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
           ON CONFLICT (id) DO UPDATE SET
             data = EXCLUDED.data,
             subject = EXCLUDED.subject,
             grade_level = EXCLUDED.grade_level,
             school_grade = EXCLUDED.school_grade,
             assigned_kid_id = EXCLUDED.assigned_kid_id,
             scan_batch_id = EXCLUDED.scan_batch_id,
             updated_at = CURRENT_TIMESTAMP`,
          [
            q.id,
            JSON.stringify(q),
            q.subject || 'math',
            q.gradeLevel || 'primary',
            q.schoolGrade || 2,
            q.assignedKidId || 'all',
            q.scanBatchId || null,
          ]
        );
      }
    }

    // 3. Sync Scanned Batches
    if (Array.isArray(payload.scannedBatches)) {
      for (const b of payload.scannedBatches) {
        if (!b || !b.id) continue;
        await client.query(
          `INSERT INTO brainboss_scanned_batches (id, data, assigned_kid_id, subject, school_grade, updated_at)
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
           ON CONFLICT (id) DO UPDATE SET
             data = EXCLUDED.data,
             assigned_kid_id = EXCLUDED.assigned_kid_id,
             subject = EXCLUDED.subject,
             school_grade = EXCLUDED.school_grade,
             updated_at = CURRENT_TIMESTAMP`,
          [
            b.id,
            JSON.stringify(b),
            b.assignedKidId || 'all',
            b.subject || 'math',
            b.schoolGrade || 2,
          ]
        );
      }
    }

    await client.query('COMMIT');
    return await getRemoteData();
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error during PostgreSQL sync push:', err);
    throw err;
  } finally {
    client.release();
  }
}
