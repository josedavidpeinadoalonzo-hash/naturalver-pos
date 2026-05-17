import './mocks';
import { productsService } from '../products.service';
import { storageService } from '../storage.service';

describe('ProductsService', () => {
  afterEach(async () => {
    await storageService.clearAll();
  });

  describe('createProduct', () => {
    it('should create a product with auto-generated id and timestamps', async () => {
      const product = await productsService.createProduct({
        name: 'Crema Test',
        category: 'Cremas',
        presentations: [{ id: 'p1', name: '60g', priceUSD: 1.5, priceBs: 10, stock: 5 }],
      });

      expect(product.id).toMatch(/^product_/);
      expect(product.createdAt).toBeGreaterThan(0);
      expect(product.updatedAt).toBeGreaterThan(0);
      expect(product.name).toBe('Crema Test');

      const products = await storageService.getProducts();
      expect(products).toHaveLength(1);
    });
  });

  describe('getProductById', () => {
    it('should return null for non-existent product', async () => {
      const product = await productsService.getProductById('non_existent');
      expect(product).toBeNull();
    });

    it('should return product by id', async () => {
      const created = await productsService.createProduct({
        name: 'Test', category: 'Cats',
        presentations: [{ id: 'p1', name: 'U', priceUSD: 1, priceBs: 40, stock: 10 }],
      });

      const found = await productsService.getProductById(created.id);
      expect(found).not.toBeNull();
      expect(found!.name).toBe('Test');
    });
  });

  describe('updateProduct', () => {
    it('should update product fields and updatedAt', async () => {
      const created = await productsService.createProduct({
        name: 'Original', category: 'Cats',
        presentations: [{ id: 'p1', name: 'U', priceUSD: 1, priceBs: 40, stock: 5 }],
      });

      const before = created.updatedAt;
      await new Promise(r => setTimeout(r, 10));

      const updated = await productsService.updateProduct(created.id, { name: 'Updated' });
      expect(updated).not.toBeNull();
      expect(updated!.name).toBe('Updated');
      expect(updated!.updatedAt).toBeGreaterThan(before);
    });

    it('should return null for non-existent product', async () => {
      const result = await productsService.updateProduct('fake_id', { name: 'New' });
      expect(result).toBeNull();
    });
  });

  describe('deleteProduct', () => {
    it('should delete existing product', async () => {
      const created = await productsService.createProduct({
        name: 'To Delete', category: 'Cats',
        presentations: [{ id: 'p1', name: 'U', priceUSD: 1, priceBs: 40, stock: 1 }],
      });

      const deleted = await productsService.deleteProduct(created.id);
      expect(deleted).toBe(true);

      const found = await productsService.getProductById(created.id);
      expect(found).toBeNull();
    });

    it('should return false when product does not exist', async () => {
      const result = await productsService.deleteProduct('fake_id');
      expect(result).toBe(false);
    });
  });

  describe('updateStock', () => {
    it('should decrement stock correctly', async () => {
      const created = await productsService.createProduct({
        name: 'Stock Test', category: 'Cats',
        presentations: [{ id: 'p1', name: '60g', priceUSD: 1, priceBs: 40, stock: 10 }],
      });

      await productsService.updateStock(created.id, 'p1', 3);
      const product = await productsService.getProductById(created.id);
      expect(product!.presentations[0].stock).toBe(7);
    });

    it('should not go below zero stock', async () => {
      const created = await productsService.createProduct({
        name: 'Stock Test', category: 'Cats',
        presentations: [{ id: 'p1', name: '60g', priceUSD: 1, priceBs: 40, stock: 2 }],
      });

      await productsService.updateStock(created.id, 'p1', 5);
      const product = await productsService.getProductById(created.id);
      expect(product!.presentations[0].stock).toBe(0);
    });

    it('should return null for non-existent product', async () => {
      const result = await productsService.updateStock('fake_id', 'p1', 5);
      expect(result).toBeNull();
    });
  });
});
