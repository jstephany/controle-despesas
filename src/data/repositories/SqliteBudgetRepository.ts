import type { MonthlyBudget } from '@/domain/entities/Budget';
import type { MonthPeriod } from '@/domain/entities/Expense';
import type { IBudgetRepository } from '@/domain/repositories/BudgetRepository';
import {
  formatMonthPeriodKey,
  isValidMonthKey,
} from '@/domain/utils/dateUtils';

import type { SQLiteExecutor } from '../database/types';

interface BudgetRow {
  readonly month_key: string;
  readonly limit_cents: number;
  readonly updated_at: string;
}

const SELECT_BUDGET_BY_MONTH_SQL = `
  SELECT month_key, limit_cents, updated_at
  FROM monthly_budgets
  WHERE month_key = ?
`;

const UPSERT_BUDGET_SQL = `
  INSERT INTO monthly_budgets (month_key, limit_cents, updated_at)
  VALUES (?, ?, ?)
  ON CONFLICT(month_key) DO UPDATE SET
    limit_cents = excluded.limit_cents,
    updated_at = excluded.updated_at
`;

const DELETE_BUDGET_BY_MONTH_SQL = `
  DELETE FROM monthly_budgets
  WHERE month_key = ?
`;

function mapRowToBudget(row: BudgetRow): MonthlyBudget {
  return {
    monthKey: row.month_key,
    limitCents: row.limit_cents,
    updatedAt: row.updated_at,
  };
}

export class SqliteBudgetRepository implements IBudgetRepository {
  constructor(private readonly db: SQLiteExecutor) {}

  async getByMonth(period: MonthPeriod): Promise<MonthlyBudget | null> {
    const monthKey = formatMonthPeriodKey(period);
    if (!isValidMonthKey(monthKey)) {
      return null;
    }

    const row = await this.db.getFirstAsync<BudgetRow>(
      SELECT_BUDGET_BY_MONTH_SQL,
      [monthKey]
    );
    return row ? mapRowToBudget(row) : null;
  }

  async upsert(period: MonthPeriod, limitCents: number): Promise<MonthlyBudget> {
    const monthKey = formatMonthPeriodKey(period);
    if (!isValidMonthKey(monthKey)) {
      throw new Error('Período mensal inválido para definição de orçamento.');
    }
    if (!Number.isSafeInteger(limitCents) || limitCents <= 0) {
      throw new Error('O limite do orçamento deve ser um valor inteiro positivo.');
    }

    const updatedAt = new Date().toISOString();
    await this.db.runAsync(UPSERT_BUDGET_SQL, [monthKey, limitCents, updatedAt]);

    return {
      monthKey,
      limitCents,
      updatedAt,
    };
  }

  async deleteByMonth(period: MonthPeriod): Promise<void> {
    const monthKey = formatMonthPeriodKey(period);
    if (!isValidMonthKey(monthKey)) {
      return;
    }
    await this.db.runAsync(DELETE_BUDGET_BY_MONTH_SQL, [monthKey]);
  }
}
