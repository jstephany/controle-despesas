import { useContext } from 'react';

import {
  ExpensesContext,
  type ExpensesContextValue,
} from '../context/ExpensesContext';

export function useExpenses(): ExpensesContextValue {
  const context = useContext(ExpensesContext);
  if (!context) {
    throw new Error('useExpenses deve ser utilizado dentro de um ExpensesProvider.');
  }
  return context;
}
