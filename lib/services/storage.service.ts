import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, Sale, Debt, Expense, CashClose, DailySummary, WeeklySummary, MonthlySummary } from '@/lib/models';

const STORAGE_KEYS = {
  PRODUCTS: 'naturalver_products',
  SALES: 'naturalver_sales',
  DEBTS: 'naturalver_debts',
  EXPENSES: 'naturalver_expenses',
  CASH_CLOSES: 'naturalver_cash_closes',
  DAILY_SUMMARY: 'naturalver_daily_summary',
  WEEKLY_SUMMARY: 'naturalver_weekly_summary',
  MONTHLY_SUMMARY: 'naturalver_monthly_summary',
  CUSTOMERS: 'naturalver_customers',
  COMPANY_CONFIG: 'naturalver_company_config',
  TEMPLATES: 'naturalver_templates',
  LAST_SYNC: 'naturalver_last_sync',
  INITIALIZED: 'naturalver_initialized',
};

class StorageService {
  /**
   * Guardar productos
   */
  async saveProducts(products: Product[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (error) {
      console.error('Error saving products:', error);
      throw error;
    }
  }

  /**
   * Obtener productos
   */
  async getProducts(): Promise<Product[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting products:', error);
      return [];
    }
  }

  /**
   * Guardar una venta
   */
  async saveSale(sale: Sale): Promise<void> {
    try {
      const sales = await this.getSales();
      sales.push(sale);
      await AsyncStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
    } catch (error) {
      console.error('Error saving sale:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las ventas
   */
  async getSales(): Promise<Sale[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SALES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting sales:', error);
      return [];
    }
  }

  /**
   * Obtener ventas por fecha
   */
  async getSalesByDate(date: string): Promise<Sale[]> {
    try {
      const sales = await this.getSales();
      return sales.filter(sale => {
        const saleDate = new Date(sale.createdAt).toISOString().split('T')[0];
        return saleDate === date;
      });
    } catch (error) {
      console.error('Error getting sales by date:', error);
      return [];
    }
  }

  /**
   * Obtener ventas por rango de fechas
   */
  async getSalesByDateRange(startDate: string, endDate: string): Promise<Sale[]> {
    try {
      const sales = await this.getSales();
      return sales.filter(sale => {
        const saleDate = new Date(sale.createdAt).toISOString().split('T')[0];
        return saleDate >= startDate && saleDate <= endDate;
      });
    } catch (error) {
      console.error('Error getting sales by date range:', error);
      return [];
    }
  }

  /**
   * Guardar resumen diario
   */
  async saveDailySummary(summary: DailySummary): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_SUMMARY, JSON.stringify(summary));
    } catch (error) {
      console.error('Error saving daily summary:', error);
      throw error;
    }
  }

  /**
   * Obtener resumen diario
   */
  async getDailySummary(): Promise<DailySummary | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_SUMMARY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting daily summary:', error);
      return null;
    }
  }

  /**
   * Guardar resumen semanal
   */
  async saveWeeklySummary(summary: WeeklySummary): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_SUMMARY, JSON.stringify(summary));
    } catch (error) {
      console.error('Error saving weekly summary:', error);
      throw error;
    }
  }

  /**
   * Obtener resumen semanal
   */
  async getWeeklySummary(): Promise<WeeklySummary | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.WEEKLY_SUMMARY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting weekly summary:', error);
      return null;
    }
  }

  /**
   * Guardar resumen mensual
   */
  async saveMonthlySummary(summary: MonthlySummary): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MONTHLY_SUMMARY, JSON.stringify(summary));
    } catch (error) {
      console.error('Error saving monthly summary:', error);
      throw error;
    }
  }

  /**
   * Obtener resumen mensual
   */
  async getMonthlySummary(): Promise<MonthlySummary | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.MONTHLY_SUMMARY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting monthly summary:', error);
      return null;
    }
  }

  // === DEUDAS ===
  async saveDebts(debts: Debt[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts));
    } catch (error) {
      console.error('Error saving debts:', error);
      throw error;
    }
  }

  async getDebts(): Promise<Debt[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DEBTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting debts:', error);
      return [];
    }
  }

  // === GASTOS ===
  async saveExpenses(expenses: Expense[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    } catch (error) {
      console.error('Error saving expenses:', error);
      throw error;
    }
  }

  async getExpenses(): Promise<Expense[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.EXPENSES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting expenses:', error);
      return [];
    }
  }

  // === CIERRE DE CAJA ===
  async saveCashCloses(closes: CashClose[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CASH_CLOSES, JSON.stringify(closes));
    } catch (error) {
      console.error('Error saving cash closes:', error);
      throw error;
    }
  }

  async getCashCloses(): Promise<CashClose[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CASH_CLOSES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting cash closes:', error);
      return [];
    }
  }

  // === CLIENTES ===
  async saveCustomers(customers: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    } catch (error) {
      console.error('Error saving customers:', error);
      throw error;
    }
  }

  async getCustomers(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting customers:', error);
      return [];
    }
  }

  // === CONFIGURACIÓN ===
  async saveCompanyConfig(config: any): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.COMPANY_CONFIG, JSON.stringify(config));
    } catch (error) {
      console.error('Error saving company config:', error);
      throw error;
    }
  }

  async getCompanyConfig(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.COMPANY_CONFIG);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting company config:', error);
      return null;
    }
  }

  // === PLANTILLAS ===
  async saveTemplates(templates: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
    } catch (error) {
      console.error('Error saving templates:', error);
      throw error;
    }
  }

  async getTemplates(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TEMPLATES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting templates:', error);
      return [];
    }
  }

  /**
   * Limpiar todo el almacenamiento
   */
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de la última sincronización
   */
  async getLastSync(): Promise<number | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      return data ? parseInt(data, 10) : null;
    } catch (error) {
      console.error('Error getting last sync:', error);
      return null;
    }
  }

  /**
   * Verificar si la app ya fue inicializada
   */
  async isInitialized(): Promise<boolean> {
    try {
      const val = await AsyncStorage.getItem(STORAGE_KEYS.INITIALIZED);
      return val === 'true';
    } catch (error) {
      return false;
    }
  }

  /**
   * Marcar la app como inicializada
   */
  async setInitialized(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    } catch (error) {
      console.error('Error setting initialized flag:', error);
    }
  }
}

export const storageService = new StorageService();

