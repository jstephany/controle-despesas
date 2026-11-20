import { isValidCategory } from '../entities/Category';
import type { CreateExpenseInput, ExpenseFormValues } from '../entities/Expense';
import { parseUserDateToIso } from '../utils/dateUtils';
import { parseCurrencyToCents } from './currency';

export const MAX_DESCRIPTION_LENGTH = 120;

export interface ExpenseValidationErrors {
  description?: string;
  amount?: string;
  date?: string;
  category?: string;
}

export type ExpenseValidationResult =
  | {
      readonly isValid: true;
      readonly data: CreateExpenseInput;
      readonly errors: Record<string, never>;
    }
  | {
      readonly isValid: false;
      readonly errors: ExpenseValidationErrors;
    };

export function validateExpenseInput(
  input: ExpenseFormValues
): ExpenseValidationResult {
  const errors: ExpenseValidationErrors = {};

  const normalizedDescription = input.description.trim();
  if (!normalizedDescription) {
    errors.description = 'Informe uma descrição para a despesa.';
  } else if (normalizedDescription.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = `A descrição deve ter no máximo ${MAX_DESCRIPTION_LENGTH} caracteres.`;
  }

  const parsedAmountCents = parseCurrencyToCents(input.amount);
  if (parsedAmountCents === null) {
    errors.amount = 'Informe um valor numérico maior que zero (ex.: 25,90).';
  }

  const parsedDate = parseUserDateToIso(input.date);
  if (parsedDate === null) {
    errors.date = 'Informe uma data válida no formato DD/MM/AAAA.';
  }

  const categoryIsValid = isValidCategory(input.category);
  if (!categoryIsValid) {
    errors.category = 'Selecione uma categoria válida.';
  }

  if (
    errors.description ||
    errors.amount ||
    errors.date ||
    errors.category ||
    parsedAmountCents === null ||
    parsedDate === null ||
    !categoryIsValid
  ) {
    return {
      isValid: false,
      errors,
    };
  }

  return {
    isValid: true,
    data: {
      description: normalizedDescription,
      amountCents: parsedAmountCents,
      date: parsedDate,
      category: input.category,
    },
    errors: {},
  };
}
