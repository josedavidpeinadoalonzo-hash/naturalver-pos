import { Sale, Product, DailySummary, WeeklySummary, MonthlySummary } from '@/lib/models';
import { storageService } from './storage.service';

class SalesService {
  /**
   * Crear una nueva venta
   */
  async createSale(
    productId: string,
    productName: string,
    presentationId: string,
    presentationName: string,
    quantity: number,
    paymentType: 'mobile' | 'cash' | 'mixed' | 'credit',
    totalAmountUSD: number,
    totalAmountBS: number,
    exchangeRate: number,
    mobileAmountBS?: number,
    cashAmountUSD?: number,
    isWholesale: boolean = false,
    wholesaleDiscount?: number,
    customerName?: string,
    customerPhone?: string
  ): Promise<Sale> {
    const sale: Sale = {
      id: `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      productId,
      productName,
      presentationId,
      presentationName,
      quantity,
      paymentType,
      totalAmountUSD,
      totalAmountBS,
      exchangeRate,
      mobileAmountBS,
      cashAmountUSD,
      isWholesale,
      wholesaleDiscount,
      customerName,
      customerPhone,
      createdAt: Date.now(),
    };

    await storageService.saveSale(sale);
    return sale;
  }

  /**
   * Calcular descuento al mayor basado en cantidad
   */
  calculateWholesaleDiscount(quantity: number): number {
    if (quantity >= 50) return 20; // 20% descuento
    if (quantity >= 30) return 15; // 15% descuento
    if (quantity >= 20) return 10; // 10% descuento
    if (quantity >= 10) return 5; // 5% descuento
    return 0; // Sin descuento
  }

  /**
   * Calcular total de venta con descuento
   */
  calculateTotal(price: number, quantity: number, discount: number = 0): number {
    const subtotal = price * quantity;
    const discountAmount = (subtotal * discount) / 100;
    return subtotal - discountAmount;
  }

  /**
   * Obtener resumen del día actual
   */
  async getDailySummary(): Promise<DailySummary> {
    const today = new Date().toISOString().split('T')[0];
    const sales = await storageService.getSalesByDate(today);

    let totalSales = 0;
    let totalMobileIncome = 0;
    let totalMobileIncomeBS = 0;
    let totalCashIncome = 0;
    let productsCount = 0;

    sales.forEach(sale => {
      totalSales += sale.totalAmountUSD;
      if (sale.paymentType === 'mobile' || sale.paymentType === 'mixed') {
        const rate = sale.exchangeRate > 0 ? sale.exchangeRate : 1;
        const mobileInUSD = (sale.mobileAmountBS || 0) / rate;
        totalMobileIncome += mobileInUSD;
        totalMobileIncomeBS += sale.mobileAmountBS || 0;
      }
      if (sale.paymentType === 'cash' || sale.paymentType === 'mixed') {
        totalCashIncome += sale.cashAmountUSD || 0;
      }
      productsCount += sale.quantity;
    });

    const summary: DailySummary = {
      date: today,
      totalSales,
      totalMobileIncome,
      totalMobileIncomeBS,
      totalCashIncome,
      productsCount,
      salesCount: sales.length,
    };

    await storageService.saveDailySummary(summary);
    return summary;
  }

  /**
   * Obtener resumen semanal
   */
  async getWeeklySummary(): Promise<WeeklySummary> {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const weekStart = startOfWeek.toISOString().split('T')[0];
    const weekEnd = endOfWeek.toISOString().split('T')[0];

    const sales = await storageService.getSalesByDateRange(weekStart, weekEnd);

    let totalSales = 0;
    let totalMobileIncome = 0;
    let totalMobileIncomeBS = 0;
    let totalCashIncome = 0;
    let productsCount = 0;

    sales.forEach(sale => {
      totalSales += sale.totalAmountUSD;
      if (sale.paymentType === 'mobile' || sale.paymentType === 'mixed') {
        const rate = sale.exchangeRate > 0 ? sale.exchangeRate : 1;
        const mobileInUSD = (sale.mobileAmountBS || 0) / rate;
        totalMobileIncome += mobileInUSD;
        totalMobileIncomeBS += sale.mobileAmountBS || 0;
      }
      if (sale.paymentType === 'cash' || sale.paymentType === 'mixed') {
        totalCashIncome += sale.cashAmountUSD || 0;
      }
      productsCount += sale.quantity;
    });

    const summary: WeeklySummary = {
      weekStart,
      weekEnd,
      totalSales,
      totalMobileIncome,
      totalMobileIncomeBS,
      totalCashIncome,
      productsCount,
      salesCount: sales.length,
    };

    await storageService.saveWeeklySummary(summary);
    return summary;
  }

  /**
   * Obtener resumen mensual
   */
  async getMonthlySummary(): Promise<MonthlySummary> {
    const today = new Date();
    const month = today.toISOString().slice(0, 7); // YYYY-MM

    const startDate = `${month}-01`;
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0];

    const sales = await storageService.getSalesByDateRange(startDate, endDate);

    let totalSales = 0;
    let totalMobileIncome = 0;
    let totalMobileIncomeBS = 0;
    let totalCashIncome = 0;
    let productsCount = 0;

    sales.forEach(sale => {
      totalSales += sale.totalAmountUSD;
      if (sale.paymentType === 'mobile' || sale.paymentType === 'mixed') {
        const rate = sale.exchangeRate > 0 ? sale.exchangeRate : 1;
        const mobileInUSD = (sale.mobileAmountBS || 0) / rate;
        totalMobileIncome += mobileInUSD;
        totalMobileIncomeBS += sale.mobileAmountBS || 0;
      }
      if (sale.paymentType === 'cash' || sale.paymentType === 'mixed') {
        totalCashIncome += sale.cashAmountUSD || 0;
      }
      productsCount += sale.quantity;
    });

    const summary: MonthlySummary = {
      month,
      totalSales,
      totalMobileIncome,
      totalMobileIncomeBS,
      totalCashIncome,
      productsCount,
      salesCount: sales.length,
    };

    await storageService.saveMonthlySummary(summary);
    return summary;
  }

  /**
   * Obtener producto más vendido
   */
  async getTopProduct(): Promise<{ product: Product; quantity: number } | null> {
    const sales = await storageService.getSales();
    const products = await storageService.getProducts();

    const productSales: { [key: string]: number } = {};

    sales.forEach(sale => {
      productSales[sale.productId] = (productSales[sale.productId] || 0) + sale.quantity;
    });

    let topProductId: string | null = null;
    let maxQuantity = 0;

    Object.entries(productSales).forEach(([productId, quantity]) => {
      if (quantity > maxQuantity) {
        maxQuantity = quantity;
        topProductId = productId;
      }
    });

    if (!topProductId) return null;

    const product = products.find(p => p.id === topProductId);
    return product ? { product, quantity: maxQuantity } : null;
  }

  /**
   * Obtener ingresos por tipo de pago
   */
  async getIncomeByPaymentType(): Promise<{
    mobile: number;
    cash: number;
    mixed: number;
  }> {
    const sales = await storageService.getSales();

    let mobile = 0;
    let cash = 0;
    let mixed = 0;

    sales.forEach(sale => {
      if (sale.paymentType === 'mobile') {
        mobile += sale.totalAmountUSD;
      } else if (sale.paymentType === 'cash') {
        cash += sale.totalAmountUSD;
      } else if (sale.paymentType === 'mixed') {
        mixed += sale.totalAmountUSD;
      }
    });

    return { mobile, cash, mixed };
  }
}

export const salesService = new SalesService();
