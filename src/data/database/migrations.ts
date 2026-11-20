import type { SQLiteExecutor } from './types';

export const DATABASE_VERSION = 2;

const MIGRATION_V1_SQL = `
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY NOT NULL,
    description TEXT NOT NULL,
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_expenses_date
    ON expenses (date DESC, created_at DESC, id DESC);

  PRAGMA user_version = 1;
`;

const MIGRATION_V2_SQL = `
  CREATE TABLE IF NOT EXISTS monthly_budgets (
    month_key TEXT PRIMARY KEY NOT NULL,
    limit_cents INTEGER NOT NULL CHECK (limit_cents > 0),
    updated_at TEXT NOT NULL
  );

  PRAGMA user_version = ${DATABASE_VERSION};
`;

interface UserVersionRow {
  user_version: number;
}

export async function migrateDatabase(db: SQLiteExecutor): Promise<void> {
  const result = await db.getFirstAsync<UserVersionRow>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  if (currentVersion < 1) {
    await db.execAsync(MIGRATION_V1_SQL);
  }

  if (currentVersion < 2) {
    await db.execAsync(MIGRATION_V2_SQL);
  }
}
