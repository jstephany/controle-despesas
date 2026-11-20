import type { CreateExpenseInput, Expense, MonthPeriod } from '../entities/Expense';

export interface IExpenseRepository {
  create(input: CreateExpenseInput): Promise<Expense>;
  findByMonth(period: MonthPeriod): Promise<Expense[]>;
  deleteById(id: string): Promise<void>;
}
