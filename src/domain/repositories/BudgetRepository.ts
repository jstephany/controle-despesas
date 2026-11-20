import type { MonthlyBudget } from '../entities/Budget';
import type { MonthPeriod } from '../entities/Expense';

export interface IBudgetRepository {
  getByMonth(period: MonthPeriod): Promise<MonthlyBudget | null>;
  upsert(period: MonthPeriod, limitCents: number): Promise<MonthlyBudget>;
  deleteByMonth(period: MonthPeriod): Promise<void>;
}
