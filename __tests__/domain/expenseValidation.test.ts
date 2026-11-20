import { EXPENSE_CATEGORIES, getCategoryMetadata, isValidCategory } from '@/domain/entities/Category';
import { validateExpenseInput } from '@/domain/services/expenseValidation';

describe('Category metadata & validation', () => {
  it('valida categorias permitidas e rejeita valores desconhecidos', () => {
    for (const category of EXPENSE_CATEGORIES) {
      expect(isValidCategory(category.id)).toBe(true);
      expect(getCategoryMetadata(category.id).label.length).toBeGreaterThan(0);
    }

    expect(isValidCategory('criptomoedas')).toBe(false);
    expect(isValidCategory('')).toBe(false);
    expect(isValidCategory(null)).toBe(false);
  });
});

describe('validateExpenseInput', () => {
  it('aceita uma despesa válida e retorna dados normalizados', () => {
    const result = validateExpenseInput({
      description: '  Supermercado do mês  ',
      amount: '142,85',
      date: '20/11/2026',
      category: 'alimentacao',
    });

    expect(result.isValid).toBe(true);
    if (result.isValid) {
      expect(result.data).toEqual({
        description: 'Supermercado do mês',
        amountCents: 14285,
        date: '2026-11-20',
        category: 'alimentacao',
      });
    }
  });

  it('bloqueia descrição vazia ou composta apenas por espaços', () => {
    const result = validateExpenseInput({
      description: '   ',
      amount: '20,00',
      date: '20/11/2026',
      category: 'outros',
    });

    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.errors.description).toBeTruthy();
      expect(result.errors.amount).toBeUndefined();
    }
  });

  it('bloqueia descrição acima de 120 caracteres', () => {
    const result = validateExpenseInput({
      description: 'a'.repeat(121),
      amount: '20,00',
      date: '20/11/2026',
      category: 'outros',
    });

    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.errors.description).toBeTruthy();
    }
  });

  it('bloqueia valor zero, negativo, vazio ou texto não numérico (RF07)', () => {
    for (const invalidAmount of ['', '   ', '0', '0,00', '-15,50', 'abc', '10,999']) {
      const result = validateExpenseInput({
        description: 'Café',
        amount: invalidAmount,
        date: '20/11/2026',
        category: 'alimentacao',
      });

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errors.amount).toBeTruthy();
      }
    }
  });

  it('bloqueia data ausente ou data de calendário inexistente', () => {
    for (const invalidDate of ['', '31/02/2026', '2026-13-01', 'amanha']) {
      const result = validateExpenseInput({
        description: 'Farmácia',
        amount: '30,00',
        date: invalidDate,
        category: 'saude',
      });

      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errors.date).toBeTruthy();
      }
    }
  });

  it('bloqueia categoria ausente ou inválida e acumula múltiplos erros simultaneamente', () => {
    const result = validateExpenseInput({
      description: '',
      amount: '-5',
      date: '',
      category: 'inexistente',
    });

    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.errors.description).toBeTruthy();
      expect(result.errors.amount).toBeTruthy();
      expect(result.errors.date).toBeTruthy();
      expect(result.errors.category).toBeTruthy();
    }
  });
});
