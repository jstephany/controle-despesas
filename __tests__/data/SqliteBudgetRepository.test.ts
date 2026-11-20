import type { SQLiteBindParams } from 'expo-sqlite';

import type { SQLiteExecutor } from '@/data/database/types';
import { SqliteBudgetRepository } from '@/data/repositories/SqliteBudgetRepository';

interface BudgetRow {
  month_key: string;
  limit_cents: number;
  updated_at: string;
}

function createBudgetSqliteStub() {
  const store = new Map<string, BudgetRow>();
  const runCalls: { sql: string; params: SQLiteBindParams }[] = [];

  const db: SQLiteExecutor = {
    execAsync: jest.fn(async () => undefined),
    async getAllAsync<T>(): Promise<T[]> {
      return [];
    },
    async getFirstAsync<T>(sql: string, params?: SQLiteBindParams): Promise<T | null> {
      const values = Array.isArray(params) ? params : [];
      if (sql.includes('FROM monthly_budgets')) {
        const key = String(values[0]);
        return (store.get(key) ?? null) as T | null;
      }
      return null;
    },
    runAsync: jest.fn(async (sql: string, params: SQLiteBindParams) => {
      runCalls.push({ sql, params });
      const values = Array.isArray(params) ? params : [];

      if (sql.includes('INSERT INTO monthly_budgets')) {
        const row: BudgetRow = {
          month_key: String(values[0]),
          limit_cents: Number(values[1]),
          updated_at: String(values[2]),
        };
        store.set(row.month_key, row);
        return { changes: 1, lastInsertRowId: 1 };
      }

      if (sql.includes('DELETE FROM monthly_budgets')) {
        const existed = store.delete(String(values[0]));
        return { changes: existed ? 1 : 0, lastInsertRowId: 0 };
      }

      return { changes: 0, lastInsertRowId: 0 };
    }),
  };

  return { db, store, runCalls };
}

describe('SqliteBudgetRepository', () => {
  it('retorna null quando não existe orçamento definido para o mês', async () => {
    const { db } = createBudgetSqliteStub();
    const repository = new SqliteBudgetRepository(db);

    await expect(
      repository.getByMonth({ year: 2026, month: 11 })
    ).resolves.toBeNull();
  });

  it('salva, atualiza e isola orçamentos por mês (YYYY-MM)', async () => {
    const { db, runCalls } = createBudgetSqliteStub();
    const repository = new SqliteBudgetRepository(db);

    const created = await repository.upsert({ year: 2026, month: 11 }, 100000);
    expect(created.monthKey).toBe('2026-11');
    expect(created.limitCents).toBe(100000);
    expect(created.updatedAt).toBeTruthy();

    const fetched = await repository.getByMonth({ year: 2026, month: 11 });
    expect(fetched).toEqual(created);

    expect(
      await repository.getByMonth({ year: 2026, month: 12 })
    ).toBeNull();

    const updated = await repository.upsert({ year: 2026, month: 11 }, 150000);
    expect(updated.limitCents).toBe(150000);
    expect(
      (await repository.getByMonth({ year: 2026, month: 11 }))?.limitCents
    ).toBe(150000);
    expect(runCalls[0].sql).toContain('ON CONFLICT(month_key) DO UPDATE');
  });

  it('remove o orçamento do mês corretamente', async () => {
    const { db } = createBudgetSqliteStub();
    const repository = new SqliteBudgetRepository(db);

    await repository.upsert({ year: 2026, month: 11 }, 120000);
    await repository.deleteByMonth({ year: 2026, month: 11 });

    await expect(
      repository.getByMonth({ year: 2026, month: 11 })
    ).resolves.toBeNull();
  });

  it('rejeita valores de orçamento inválidos (<= 0 ou não inteiros)', async () => {
    const { db } = createBudgetSqliteStub();
    const repository = new SqliteBudgetRepository(db);

    await expect(
      repository.upsert({ year: 2026, month: 11 }, 0)
    ).rejects.toThrow();
    await expect(
      repository.upsert({ year: 2026, month: 11 }, -5000)
    ).rejects.toThrow();
    await expect(
      repository.upsert({ year: 2026, month: 11 }, 10.5)
    ).rejects.toThrow();
    expect(db.runAsync).not.toHaveBeenCalled();
  });
});
