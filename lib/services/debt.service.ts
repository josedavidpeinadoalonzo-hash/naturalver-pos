import { Debt, DebtPayment } from '@/lib/models';
import { storageService } from './storage.service';

class DebtService {
  /**
   * Crear una nueva deuda
   */
  async createDebt(
    customerName: string,
    productName: string,
    totalAmountUSD: number,
    saleId?: string,
    customerPhone?: string,
    dueDate?: number
  ): Promise<Debt> {
    const debt: Debt = {
      id: `debt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customerName,
      customerPhone,
      saleId,
      productName,
      totalAmountUSD,
      paidAmountUSD: 0,
      remainingUSD: totalAmountUSD,
      status: 'pending',
      payments: [],
      dueDate,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const debts = await storageService.getDebts();
    debts.push(debt);
    await storageService.saveDebts(debts);
    return debt;
  }

  /**
   * Registrar un abono a una deuda
   */
  async addPayment(
    debtId: string,
    amount: number,
    amountBS: number,
    paymentType: 'mobile' | 'cash' | 'mixed',
    exchangeRate: number,
    note?: string
  ): Promise<Debt> {
    const debts = await storageService.getDebts();
    const debtIndex = debts.findIndex(d => d.id === debtId);

    if (debtIndex === -1) {
      throw new Error('Deuda no encontrada');
    }

    const debt = debts[debtIndex];

    const payment: DebtPayment = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount,
      amountBS,
      paymentType,
      exchangeRate,
      note,
      createdAt: Date.now(),
    };

    debt.payments.push(payment);
    debt.paidAmountUSD += amount;
    debt.remainingUSD = Math.max(0, debt.totalAmountUSD - debt.paidAmountUSD);
    debt.updatedAt = Date.now();

    if (debt.remainingUSD <= 0) {
      debt.status = 'paid';
    } else if (debt.paidAmountUSD > 0) {
      debt.status = 'partial';
    }

    debts[debtIndex] = debt;
    await storageService.saveDebts(debts);
    return debt;
  }

  /**
   * Obtener todas las deudas pendientes
   */
  async getPendingDebts(): Promise<Debt[]> {
    const debts = await storageService.getDebts();
    return debts.filter(d => d.status !== 'paid');
  }

  /**
   * Obtener el total de deudas pendientes
   */
  async getTotalPending(): Promise<number> {
    const pending = await this.getPendingDebts();
    return pending.reduce((acc, d) => acc + d.remainingUSD, 0);
  }

  /**
   * Eliminar una deuda
   */
  async deleteDebt(debtId: string): Promise<void> {
    const debts = await storageService.getDebts();
    const filtered = debts.filter(d => d.id !== debtId);
    await storageService.saveDebts(filtered);
  }
}

export const debtService = new DebtService();
