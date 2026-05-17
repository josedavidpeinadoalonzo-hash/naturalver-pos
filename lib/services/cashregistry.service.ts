import { CashClose, Sale, Expense } from '../models';
import { storageService } from './storage.service';

class CashRegistryService {
  async getCloses(): Promise<CashClose[]> {
    return await storageService.getCashCloses();
  }

  async createClose(
    sales: Sale[],
    expenses: Expense[],
    openingBalanceUSD: number,
    totalSalesUSD: number,
    totalExpensesUSD: number,
    exchangeRate: number
  ): Promise<CashClose> {
    const netProfitUSD = totalSalesUSD - totalExpensesUSD;
    const closingBalanceUSD = openingBalanceUSD + netProfitUSD;

    const close: CashClose = {
      id: `close_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      openingBalanceUSD,
      closingBalanceUSD,
      totalSalesUSD,
      totalExpensesUSD,
      netProfitUSD,
      exchangeRate,
      status: 'closed',
      createdAt: Date.now(),
    };

    const closes = await this.getCloses();
    closes.push(close);
    await storageService.saveCashCloses(closes);
    
    // Opcional: Limpiar ventas y gastos del día si se desea, 
    // pero usualmente se mantienen en el historial.
    
    return close;
  }

  async getLastClose(): Promise<CashClose | null> {
    const closes = await this.getCloses();
    if (closes.length === 0) return null;
    return closes[closes.length - 1];
  }
}

export const cashRegistryService = new CashRegistryService();
