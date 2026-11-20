import type {
  CreateExpenseInput,
  Expense,
  MonthPeriod,
  UpdateExpenseInput,
} from '../entities/Expense';

export interface IExpenseRepository {
  create(input: CreateExpenseInput): Promise<Expense>;
  update(input: UpdateExpenseInput): Promise<Expense>;
  findById(id: string): Promise<Expense | null>;
  findByMonth(period: MonthPeriod): Promise<Expense[]>;
  deleteById(id: string): Promise<void>;
}
