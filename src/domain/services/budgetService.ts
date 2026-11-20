import type { BudgetEvaluation, BudgetStatus } from '../entities/Budget';
import { parseCurrencyToCents } from './currency';

export type BudgetValidationResult =
  | { readonly isValid: true; readonly limitCents: number }
  | { readonly isValid: false; readonly error: string };

export function validateBudgetInput(rawAmount: string): BudgetValidationResult {
  const limitCents = parseCurrencyToCents(rawAmount);

  if (limitCents === null) {
    return {
      isValid: false,
      error: 'Informe um limite mensal numérico maior que zero (ex.: 1.000,00).',
    };
  }

  return {
    isValid: true,
    limitCents,
  };
}

export function evaluateMonthlyBudget(
  spentCents: number,
  limitCents: number
): BudgetEvaluation {
  const safeSpent = Math.max(0, Math.trunc(spentCents));
  const safeLimit = Math.max(1, Math.trunc(limitCents));

  const remainingCents = safeLimit - safeSpent;
  const rawPercent = (safeSpent / safeLimit) * 100;

  let status: BudgetStatus;
  let percentage: number;

  if (safeSpent >= safeLimit) {
    status = 'exceeded';
    percentage = Math.max(100, Math.round(rawPercent));
  } else if (safeSpent * 100 <= safeLimit * 75) {
    status = 'normal';
    percentage = Math.min(75, Math.round(rawPercent));
  } else {
    status = 'warning';
    percentage = Math.min(99, Math.round(rawPercent));
  }

  return {
    limitCents: safeLimit,
    spentCents: safeSpent,
    remainingCents,
    percentage,
    progressRatio: Math.min(1, safeSpent / safeLimit),
    status,
  };
}
