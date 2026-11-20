import { DATABASE_VERSION, migrateDatabase } from '@/data/database/migrations';
import type { SQLiteExecutor } from '@/data/database/types';

function createFakeDb(initialVersion: number) {
  const executedSql: string[] = [];
  const db: SQLiteExecutor = {
    execAsync: jest.fn(async (sql: string) => {
      executedSql.push(sql);
    }),
    runAsync: jest.fn(async () => ({ changes: 0, lastInsertRowId: 0 })),
    async getFirstAsync<T>(): Promise<T | null> {
      return { user_version: initialVersion } as T;
    },
    async getAllAsync<T>(): Promise<T[]> {
      return [];
    },
  };
  return { db, executedSql };
}

describe('migrateDatabase', () => {
  it('cria tabelas expenses e monthly_budgets com constraints e atualiza user_version quando versão é 0', async () => {
    const { db, executedSql } = createFakeDb(0);

    await migrateDatabase(db);

    const combinedSql = executedSql.join('\n');
    expect(combinedSql).toContain('CREATE TABLE IF NOT EXISTS expenses');
    expect(combinedSql).toContain('CHECK (amount_cents > 0)');
    expect(combinedSql).toContain('CREATE INDEX IF NOT EXISTS idx_expenses_date');
    expect(combinedSql).toContain('CREATE TABLE IF NOT EXISTS monthly_budgets');
    expect(combinedSql).toContain('CHECK (limit_cents > 0)');
    expect(combinedSql).toContain(`PRAGMA user_version = ${DATABASE_VERSION}`);
  });

  it('executa apenas a migração v2 ao atualizar de um banco já na versão 1', async () => {
    const { db, executedSql } = createFakeDb(1);

    await migrateDatabase(db);

    const combinedSql = executedSql.join('\n');
    expect(combinedSql).not.toContain('CREATE TABLE IF NOT EXISTS expenses');
    expect(combinedSql).toContain('CREATE TABLE IF NOT EXISTS monthly_budgets');
    expect(combinedSql).toContain(`PRAGMA user_version = ${DATABASE_VERSION}`);
  });

  it('é idempotente e não reexecuta DDL quando banco já está na versão atual', async () => {
    const { db } = createFakeDb(DATABASE_VERSION);

    await migrateDatabase(db);

    expect(db.execAsync).not.toHaveBeenCalled();
  });
});
