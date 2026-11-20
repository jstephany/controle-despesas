import {
  evaluateMonthlyBudget,
  validateBudgetInput,
} from '@/domain/services/budgetService';

describe('budgetService', () => {
  describe('validateBudgetInput', () => {
    it('aceita valores monetários estritamente positivos e converte para centavos', () => {
      expect(validateBudgetInput('1.000,00')).toEqual({
        isValid: true,
        limitCents: 100000,
      });
      expect(validateBudgetInput('850,50')).toEqual({
        isValid: true,
        limitCents: 85050,
      });
      expect(validateBudgetInput('R$ 500')).toEqual({
        isValid: true,
        limitCents: 50000,
      });
    });

    it('rejeita zero, valores negativos, vazios ou não numéricos', () => {
      for (const invalid of ['', '   ', '0', '0,00', '-100,00', 'abc', '50,999']) {
        const result = validateBudgetInput(invalid);
        expect(result.isValid).toBe(false);
        if (!result.isValid) {
          expect(result.error).toBeTruthy();
        }
      }
    });
  });

  describe('evaluateMonthlyBudget', () => {
    it('classifica como normal até exatamente 75% do orçamento', () => {
      const zeroSpent = evaluateMonthlyBudget(0, 100000);
      expect(zeroSpent).toEqual({
        limitCents: 100000,
        spentCents: 0,
        remainingCents: 100000,
        percentage: 0,
        progressRatio: 0,
        status: 'normal',
      });

      const exactBoundary = evaluateMonthlyBudget(75000, 100000);
      expect(exactBoundary.status).toBe('normal');
      expect(exactBoundary.percentage).toBe(75);
      expect(exactBoundary.remainingCents).toBe(25000);
      expect(exactBoundary.progressRatio).toBe(0.75);
    });

    it('classifica como warning acima de 75% e abaixo de 100% sem arredondar falsamente para exceeded', () => {
      const justOver75 = evaluateMonthlyBudget(75001, 100000);
      expect(justOver75.status).toBe('warning');
      expect(justOver75.percentage).toBe(75);

      const eightyFive = evaluateMonthlyBudget(85000, 100000);
      expect(eightyFive.status).toBe('warning');
      expect(eightyFive.percentage).toBe(85);
      expect(eightyFive.remainingCents).toBe(15000);
      expect(eightyFive.progressRatio).toBe(0.85);

      const almostFull = evaluateMonthlyBudget(99990, 100000);
      expect(almostFull.status).toBe('warning');
      expect(almostFull.percentage).toBe(99);
      expect(almostFull.remainingCents).toBe(10);
    });

    it('classifica como exceeded em 100% ou mais e limita progressRatio em 1', () => {
      const exactLimit = evaluateMonthlyBudget(100000, 100000);
      expect(exactLimit.status).toBe('exceeded');
      expect(exactLimit.percentage).toBe(100);
      expect(exactLimit.remainingCents).toBe(0);
      expect(exactLimit.progressRatio).toBe(1);

      const overBudget = evaluateMonthlyBudget(125000, 100000);
      expect(overBudget.status).toBe('exceeded');
      expect(overBudget.percentage).toBe(125);
      expect(overBudget.remainingCents).toBe(-25000);
      expect(overBudget.progressRatio).toBe(1);
    });
  });
});
