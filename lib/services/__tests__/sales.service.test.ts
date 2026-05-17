import './mocks';
import { salesService } from '../sales.service';
import { storageService } from '../storage.service';

describe('SalesService', () => {
  describe('createSale', () => {
    it('should create a sale with correct fields', async () => {
      const sale = await salesService.createSale(
        'p1', 'Crema Test', 'pres1', '60g', 2, 'cash', 3.0, 60, 40, 0, 3.0, false, 0
      );

      expect(sale.id).toMatch(/^sale_/);
      expect(sale.productName).toBe('Crema Test');
      expect(sale.quantity).toBe(2);
      expect(sale.totalAmountUSD).toBe(3.0);
      expect(sale.paymentType).toBe('cash');
      expect(sale.createdAt).toBeGreaterThan(0);

      const saved = await storageService.getSales();
      expect(saved).toHaveLength(1);
      expect(saved[0].id).toBe(sale.id);
    });

    it('should handle mobile payment type', async () => {
      const sale = await salesService.createSale(
        'p1', 'Crema', 'pres1', '60g', 1, 'mobile', 1.5, 60, 40, 60, 0, false, 0
      );

      expect(sale.paymentType).toBe('mobile');
      expect(sale.mobileAmountBS).toBe(60);
    });

    it('should handle mixed payment type', async () => {
      const sale = await salesService.createSale(
        'p1', 'Crema', 'pres1', '60g', 1, 'mixed', 1.5, 60, 40, 30, 0.75, false, 0
      );

      expect(sale.paymentType).toBe('mixed');
      expect(sale.mobileAmountBS).toBe(30);
      expect(sale.cashAmountUSD).toBe(0.75);
    });

    it('should handle wholesale discount', async () => {
      const sale = await salesService.createSale(
        'p1', 'Crema', 'pres1', '60g', 10, 'cash', 15, 600, 40, 0, 15, true, 5
      );

      expect(sale.isWholesale).toBe(true);
      expect(sale.wholesaleDiscount).toBe(5);
    });
  });

  describe('calculateWholesaleDiscount', () => {
    it('should return 0 for small quantities', () => {
      expect(salesService.calculateWholesaleDiscount(1)).toBe(0);
      expect(salesService.calculateWholesaleDiscount(5)).toBe(0);
      expect(salesService.calculateWholesaleDiscount(9)).toBe(0);
    });

    it('should return 5% for 10-19 items', () => {
      expect(salesService.calculateWholesaleDiscount(10)).toBe(5);
      expect(salesService.calculateWholesaleDiscount(15)).toBe(5);
      expect(salesService.calculateWholesaleDiscount(19)).toBe(5);
    });

    it('should return 10% for 20-29 items', () => {
      expect(salesService.calculateWholesaleDiscount(20)).toBe(10);
      expect(salesService.calculateWholesaleDiscount(25)).toBe(10);
    });

    it('should return 15% for 30-49 items', () => {
      expect(salesService.calculateWholesaleDiscount(30)).toBe(15);
      expect(salesService.calculateWholesaleDiscount(40)).toBe(15);
      expect(salesService.calculateWholesaleDiscount(49)).toBe(15);
    });

    it('should return 20% for 50+ items', () => {
      expect(salesService.calculateWholesaleDiscount(50)).toBe(20);
      expect(salesService.calculateWholesaleDiscount(100)).toBe(20);
    });
  });

  describe('calculateTotal', () => {
    it('should calculate total without discount', () => {
      expect(salesService.calculateTotal(10, 3)).toBe(30);
    });

    it('should apply percentage discount', () => {
      const total = salesService.calculateTotal(10, 3, 10);
      expect(total).toBe(27); // 30 - 3 = 27
    });

    it('should handle zero price', () => {
      expect(salesService.calculateTotal(0, 5)).toBe(0);
    });

    it('should handle zero quantity', () => {
      expect(salesService.calculateTotal(10, 0)).toBe(0);
    });

    it('should handle 100% discount', () => {
      expect(salesService.calculateTotal(10, 3, 100)).toBe(0);
    });
  });

  describe('getDailySummary', () => {
    it('should return empty summary when no sales today', async () => {
      const summary = await salesService.getDailySummary();
      expect(summary.totalSales).toBe(0);
      expect(summary.salesCount).toBe(0);
      expect(summary.totalCashIncome).toBe(0);
      expect(summary.totalMobileIncome).toBe(0);
    });

    it('should calculate correct daily totals', async () => {
      await salesService.createSale('p1', 'A', 'pres1', '60g', 1, 'cash', 10, 400, 40, 0, 10, false, 0);
      await salesService.createSale('p1', 'A', 'pres1', '60g', 2, 'mobile', 5, 200, 40, 200, 0, false, 0);

      const summary = await salesService.getDailySummary();
      expect(summary.salesCount).toBe(2);
      expect(summary.productsCount).toBe(3);
      expect(summary.totalCashIncome).toBe(10);
      expect(summary.totalMobileIncomeBS).toBe(200);
    });
  });
});
