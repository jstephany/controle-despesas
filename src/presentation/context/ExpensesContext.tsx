import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { getDatabase } from '@/data/database/client';
import { SqliteExpenseRepository } from '@/data/repositories/SqliteExpenseRepository';
import type {
  CreateExpenseInput,
  Expense,
  MonthPeriod,
  UpdateExpenseInput,
} from '@/domain/entities/Expense';
import type { IExpenseRepository } from '@/domain/repositories/ExpenseRepository';
import {
  calculateCategoryBreakdown,
  calculateMonthlyTotal,
  sortExpensesChronologically,
  type CategoryBreakdownItem,
} from '@/domain/services/expenseCalculations';
import {
  getCurrentMonthPeriod,
  getMonthPeriodFromIsoDate,
  getNextMonth,
  getPreviousMonth,
} from '@/domain/utils/dateUtils';

export interface ExpensesContextValue {
  readonly selectedPeriod: MonthPeriod;
  readonly expenses: Expense[];
  readonly monthlyTotalCents: number;
  readonly categoryBreakdown: CategoryBreakdownItem[];
  readonly isInitializing: boolean;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly selectPeriod: (period: MonthPeriod) => void;
  readonly goToPreviousMonth: () => void;
  readonly goToNextMonth: () => void;
  readonly goToCurrentMonth: () => void;
  readonly getExpenseById: (id: string) => Promise<Expense | null>;
  readonly addExpense: (input: CreateExpenseInput) => Promise<Expense>;
  readonly updateExpense: (input: UpdateExpenseInput) => Promise<Expense>;
  readonly deleteExpense: (id: string) => Promise<void>;
  readonly refresh: () => Promise<void>;
}

export const ExpensesContext = createContext<ExpensesContextValue | null>(null);

interface ExpensesProviderProps {
  readonly children: ReactNode;
  readonly repository?: IExpenseRepository;
  readonly initialPeriod?: MonthPeriod;
}

function getPeriodKey(period: MonthPeriod): string {
  return `${period.year}-${period.month}`;
}

export function ExpensesProvider({
  children,
  repository: injectedRepository,
  initialPeriod,
}: ExpensesProviderProps) {
  const [sqliteRepository, setSqliteRepository] =
    useState<IExpenseRepository | null>(null);
  const [initDone, setInitDone] = useState<boolean>(false);
  const [selectedPeriod, setSelectedPeriod] = useState<MonthPeriod>(
    () => initialPeriod ?? getCurrentMonthPeriod()
  );
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadedPeriodKey, setLoadedPeriodKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRequestIdRef = useRef(0);

  const activeRepository = injectedRepository ?? sqliteRepository;
  const isInitializing = !injectedRepository && !initDone;
  const currentPeriodKey = getPeriodKey(selectedPeriod);
  const isLoading =
    isInitializing ||
    (activeRepository !== null && loadedPeriodKey !== currentPeriodKey);

  useEffect(() => {
    if (injectedRepository) {
      return;
    }

    let cancelled = false;
    getDatabase()
      .then((db) => {
        if (cancelled) return;
        setSqliteRepository(new SqliteExpenseRepository(db));
        setError(null);
        setInitDone(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : 'Não foi possível inicializar o banco de dados local.'
        );
        setInitDone(true);
      });

    return () => {
      cancelled = true;
    };
  }, [injectedRepository]);

  useEffect(() => {
    if (!activeRepository) {
      return;
    }

    const requestId = ++loadRequestIdRef.current;
    const periodKey = getPeriodKey(selectedPeriod);

    activeRepository
      .findByMonth(selectedPeriod)
      .then((data) => {
        if (requestId !== loadRequestIdRef.current) return;
        setExpenses(sortExpensesChronologically(data));
        setError(null);
        setLoadedPeriodKey(periodKey);
      })
      .catch((err: unknown) => {
        if (requestId !== loadRequestIdRef.current) return;
        setError(
          err instanceof Error
            ? err.message
            : 'Não foi possível carregar as despesas deste mês.'
        );
        setLoadedPeriodKey(periodKey);
      });
  }, [activeRepository, selectedPeriod]);

  const selectPeriod = useCallback((period: MonthPeriod) => {
    setSelectedPeriod(period);
  }, []);

  const goToPreviousMonth = useCallback(() => {
    setSelectedPeriod((prev) => getPreviousMonth(prev));
  }, []);

  const goToNextMonth = useCallback(() => {
    setSelectedPeriod((prev) => getNextMonth(prev));
  }, []);

  const goToCurrentMonth = useCallback(() => {
    setSelectedPeriod(getCurrentMonthPeriod());
  }, []);

  const getExpenseById = useCallback(
    async (id: string): Promise<Expense | null> => {
      const inMemory = expenses.find((item) => item.id === id);
      if (inMemory) {
        return inMemory;
      }
      if (!activeRepository) {
        return null;
      }
      return activeRepository.findById(id);
    },
    [expenses, activeRepository]
  );

  const addExpense = useCallback(
    async (input: CreateExpenseInput): Promise<Expense> => {
      if (!activeRepository) {
        throw new Error('Banco de dados local ainda não está pronto.');
      }

      const created = await activeRepository.create(input);
      const expensePeriod = getMonthPeriodFromIsoDate(created.date);

      if (
        expensePeriod &&
        (expensePeriod.year !== selectedPeriod.year ||
          expensePeriod.month !== selectedPeriod.month)
      ) {
        setSelectedPeriod(expensePeriod);
      } else {
        setExpenses((prev) => sortExpensesChronologically([created, ...prev]));
      }

      return created;
    },
    [activeRepository, selectedPeriod]
  );

  const updateExpense = useCallback(
    async (input: UpdateExpenseInput): Promise<Expense> => {
      if (!activeRepository) {
        throw new Error('Banco de dados local ainda não está pronto.');
      }

      const updated = await activeRepository.update(input);
      const expensePeriod = getMonthPeriodFromIsoDate(updated.date);

      if (
        expensePeriod &&
        (expensePeriod.year !== selectedPeriod.year ||
          expensePeriod.month !== selectedPeriod.month)
      ) {
        setExpenses((prev) => prev.filter((item) => item.id !== updated.id));
        setSelectedPeriod(expensePeriod);
      } else {
        setExpenses((prev) =>
          sortExpensesChronologically(
            prev.map((item) => (item.id === updated.id ? updated : item))
          )
        );
      }

      return updated;
    },
    [activeRepository, selectedPeriod]
  );

  const deleteExpense = useCallback(
    async (id: string): Promise<void> => {
      if (!activeRepository) {
        throw new Error('Banco de dados local ainda não está pronto.');
      }

      await activeRepository.deleteById(id);
      setExpenses((prev) => prev.filter((item) => item.id !== id));
    },
    [activeRepository]
  );

  const refresh = useCallback(async () => {
    if (!activeRepository) {
      return;
    }
    const requestId = ++loadRequestIdRef.current;
    const periodKey = getPeriodKey(selectedPeriod);
    try {
      const data = await activeRepository.findByMonth(selectedPeriod);
      if (requestId === loadRequestIdRef.current) {
        setExpenses(sortExpensesChronologically(data));
        setError(null);
        setLoadedPeriodKey(periodKey);
      }
    } catch (err) {
      if (requestId === loadRequestIdRef.current) {
        setError(
          err instanceof Error
            ? err.message
            : 'Não foi possível carregar as despesas deste mês.'
        );
        setLoadedPeriodKey(periodKey);
      }
    }
  }, [activeRepository, selectedPeriod]);

  const monthlyTotalCents = useMemo(
    () => calculateMonthlyTotal(expenses),
    [expenses]
  );

  const categoryBreakdown = useMemo(
    () => calculateCategoryBreakdown(expenses),
    [expenses]
  );

  const value = useMemo<ExpensesContextValue>(
    () => ({
      selectedPeriod,
      expenses,
      monthlyTotalCents,
      categoryBreakdown,
      isInitializing,
      isLoading,
      error,
      selectPeriod,
      goToPreviousMonth,
      goToNextMonth,
      goToCurrentMonth,
      getExpenseById,
      addExpense,
      updateExpense,
      deleteExpense,
      refresh,
    }),
    [
      selectedPeriod,
      expenses,
      monthlyTotalCents,
      categoryBreakdown,
      isInitializing,
      isLoading,
      error,
      selectPeriod,
      goToPreviousMonth,
      goToNextMonth,
      goToCurrentMonth,
      getExpenseById,
      addExpense,
      updateExpense,
      deleteExpense,
      refresh,
    ]
  );

  return (
    <ExpensesContext.Provider value={value}>{children}</ExpensesContext.Provider>
  );
}
