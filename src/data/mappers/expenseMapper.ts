import { isValidCategory } from '@/domain/entities/Category';
import type { Expense } from '@/domain/entities/Expense';

export interface ExpenseRow {
  readonly id: string;
  readonly description: string;
  readonly amount_cents: number;
  readonly date: string;
  readonly category: string;
  readonly created_at: string;
}

export function mapRowToExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    description: row.description,
    amountCents: row.amount_cents,
    date: row.date,
    category: isValidCategory(row.category) ? row.category : 'outros',
    createdAt: row.created_at,
  };
}

export function mapExpenseToRow(expense: Expense): ExpenseRow {
  return {
    id: expense.id,
    description: expense.description,
    amount_cents: expense.amountCents,
    date: expense.date,
    category: expense.category,
    created_at: expense.createdAt,
  };
}
