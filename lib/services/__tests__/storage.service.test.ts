import './mocks';
import { storageService } from '../storage.service';
import type { Product, Sale } from '@/lib/models';

describe('StorageService', () => {
  describe('Products', () => {
    const sampleProduct: Product = {
      id: 'p1',
      name: 'Crema Test',
      category: 'Cremas',
      presentations: [{ id: 'pres1', name: '60g', priceUSD: 1.5, priceBs: 10, stock: 5 }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    it('should save and retrieve products', async () => {
      await storageService.saveProducts([sampleProduct]);
      const products = await storageService.getProducts();
      expect(products).toHaveLength(1);
      expect(products[0].name).toBe('Crema Test');
    });

    it('should return empty array when no products saved', async () => {
      const products = await storageService.getProducts();
      expect(products).toEqual([]);
    });

    it('should overwrite products on save', async () => {
      await storageService.saveProducts([sampleProduct]);
      await storageService.saveProducts([]);
      const products = await storageService.getProducts();
      expect(products).toEqual([]);
    });
  });

  describe('Sales', () => {
    const sampleSale: Sale = {
      id: 'sale_1',
      productId: 'p1',
      productName: 'Crema Test',
      presentationId: 'pres1',
      presentationName: '60g',
      quantity: 2,
      paymentType: 'cash',
      totalAmountUSD: 3.0,
      totalAmountBS: 60,
      exchangeRate: 40,
      isWholesale: false,
      createdAt: Date.now(),
    };

    it('should save and retrieve sales', async () => {
      await storageService.saveSale(sampleSale);
      const sales = await storageService.getSales();
      expect(sales).toHaveLength(1);
      expect(sales[0].totalAmountUSD).toBe(3.0);
    });

    it('should filter sales by date', async () => {
      await storageService.saveSale(sampleSale);
      const today = new Date().toISOString().split('T')[0];
      const todaySales = await storageService.getSalesByDate(today);
      expect(todaySales).toHaveLength(1);

      const yesterdaySales = await storageService.getSalesByDate('2020-01-01');
      expect(yesterdaySales).toHaveLength(0);
    });

    it('should filter sales by date range', async () => {
      await storageService.saveSale(sampleSale);
      const today = new Date().toISOString().split('T')[0];
      const rangeSales = await storageService.getSalesByDateRange('2020-01-01', today);
      expect(rangeSales).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle corrupted JSON gracefully', async () => {
      const mockStorage = await import('@react-native-async-storage/async-storage');
      (mockStorage.default.getItem as any).mockRejectedValueOnce(new Error('Corrupted data'));
      
      const products = await storageService.getProducts();
      expect(products).toEqual([]);
    });

    it('should throw on save errors', async () => {
      const mockStorage = await import('@react-native-async-storage/async-storage');
      (mockStorage.default.setItem as any).mockRejectedValueOnce(new Error('Storage full'));
      
      await expect(storageService.saveProducts([])).rejects.toThrow('Storage full');
    });
  });

  describe('Clear All', () => {
    it('should clear all stored data', async () => {
      await storageService.saveProducts([{ id: 'p1', name: 'Test', category: 'Cats', presentations: [], createdAt: 1, updatedAt: 1 }]);
      await storageService.saveSale({ id: 's1', productId: 'p1', productName: 'Test', presentationId: 'p1', presentationName: 'U', quantity: 1, paymentType: 'cash', totalAmountUSD: 1, totalAmountBS: 40, exchangeRate: 40, isWholesale: false, createdAt: 1 });
      await storageService.clearAll();
      
      const products = await storageService.getProducts();
      const sales = await storageService.getSales();
      expect(products).toEqual([]);
      expect(sales).toEqual([]);
    });
  });
});
