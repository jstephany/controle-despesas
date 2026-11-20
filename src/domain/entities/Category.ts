export interface CategoryMetadata {
  readonly id: ExpenseCategory;
  readonly label: string;
  readonly color: string;
  readonly backgroundColor: string;
}

export const EXPENSE_CATEGORIES = [
  {
    id: 'alimentacao',
    label: 'Alimentação',
    color: '#EA580C',
    backgroundColor: '#FFF7ED',
  },
  {
    id: 'transporte',
    label: 'Transporte',
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  {
    id: 'moradia',
    label: 'Moradia',
    color: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  {
    id: 'saude',
    label: 'Saúde',
    color: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  {
    id: 'lazer',
    label: 'Lazer',
    color: '#DB2777',
    backgroundColor: '#FDF2F8',
  },
  {
    id: 'educacao',
    label: 'Educação',
    color: '#0891B2',
    backgroundColor: '#ECFEFF',
  },
  {
    id: 'outros',
    label: 'Outros',
    color: '#475569',
    backgroundColor: '#F1F5F9',
  },
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]['id'];

const CATEGORY_MAP: ReadonlyMap<ExpenseCategory, CategoryMetadata> = new Map(
  EXPENSE_CATEGORIES.map((item) => [item.id, item])
);

export function isValidCategory(value: unknown): value is ExpenseCategory {
  return typeof value === 'string' && CATEGORY_MAP.has(value as ExpenseCategory);
}

export function getCategoryMetadata(category: ExpenseCategory): CategoryMetadata {
  const metadata = CATEGORY_MAP.get(category);
  if (!metadata) {
    return EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
  }
  return metadata;
}
