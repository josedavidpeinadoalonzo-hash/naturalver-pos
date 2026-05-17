import { Expense, ExpenseCategory } from '@/lib/models';
import { storageService } from './storage.service';

class ExpenseService {
  /**
   * Crear un nuevo gasto
   */
  async createExpense(
    description: string,
    category: ExpenseCategory,
    amountUSD: number,
    amountBS: number,
    exchangeRate: number,
    paymentType: 'mobile' | 'cash' | 'mixed',
    note?: string
  ): Promise<Expense> {
    const expense: Expense = {
      id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      description,
      category,
      amountUSD,
      amountBS,
      exchangeRate,
      paymentType,
      note,
      createdAt: Date.now(),
    };

    const expenses = await storageService.getExpenses();
    expenses.push(expense);
    await storageService.saveExpenses(expenses);
    return expense;
  }

  /**
   * Obtener gastos del día
   */
  async getTodayExpenses(): Promise<Expense[]> {
    const today = new Date().toISOString().split('T')[0];
    const expenses = await storageService.getExpenses();
    return expenses.filter(e => {
      const expDate = new Date(e.createdAt).toISOString().split('T')[0];
      return expDate === today;
    });
  }

  /**
   * Obtener total de gastos del día en USD
   */
  async getTodayTotal(): Promise<number> {
    const todayExpenses = await this.getTodayExpenses();
    return todayExpenses.reduce((acc, e) => acc + e.amountUSD, 0);
  }

  /**
   * Obtener gastos por categoría
   */
  async getByCategory(): Promise<Record<ExpenseCategory, number>> {
    const expenses = await storageService.getExpenses();
    const result: Record<ExpenseCategory, number> = {
      transporte: 0,
      mercancia: 0,
      servicios: 0,
      alquiler: 0,
      empaque: 0,
      otro: 0,
    };

    expenses.forEach(e => {
      result[e.category] += e.amountUSD;
    });

    return result;
  }

  /**
   * Eliminar un gasto
   */
  async deleteExpense(expenseId: string): Promise<void> {
    const expenses = await storageService.getExpenses();
    const filtered = expenses.filter(e => e.id !== expenseId);
    await storageService.saveExpenses(filtered);
  }

  /**
   * Categorías con emojis
   */
  getCategoryLabel(category: ExpenseCategory): { label: string; emoji: string } {
    const map: Record<ExpenseCategory, { label: string; emoji: string }> = {
      transporte: { label: 'Transporte', emoji: '🚗' },
      mercancia: { label: 'Mercancía', emoji: '📦' },
      servicios: { label: 'Servicios', emoji: '⚡' },
      alquiler: { label: 'Alquiler', emoji: '🏠' },
      empaque: { label: 'Empaque', emoji: '🎁' },
      otro: { label: 'Otro', emoji: '📌' },
    };
    return map[category];
  }
}

export const expenseService = new ExpenseService();
