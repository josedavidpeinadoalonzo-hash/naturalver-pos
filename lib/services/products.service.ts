import { Product, ProductPresentation } from '@/lib/models';
import { storageService } from './storage.service';

const INITIAL_PRODUCTS: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Crema Rompe Dolor',
    category: 'Cremas',
    description: 'Crema analgésica para aliviar dolores musculares y articulares',
    imageUri: '',
    presentations: [
      { id: 'p1_60g', name: '60g', priceUSD: 0, priceBs: 0, stock: 0 },
      { id: 'p1_120g', name: '120g', priceUSD: 0, priceBs: 0, stock: 0 },
      { id: 'p1_350g', name: '350g', priceUSD: 0, priceBs: 0, stock: 0 },
      { id: 'p1_500g', name: '500g', priceUSD: 0, priceBs: 0, stock: 0 },
    ],
  },
  {
    name: 'Crema Milagrosa de Azufre',
    category: 'Cremas',
    description: 'Crema con azufre para tratamientos dermatológicos',
    imageUri: '',
    presentations: [
      { id: 'p2_60g', name: '60g', priceUSD: 0, priceBs: 0, stock: 0 },
      { id: 'p2_120g', name: '120g', priceUSD: 0, priceBs: 0, stock: 0 },
      { id: 'p2_350g', name: '350g', priceUSD: 0, priceBs: 0, stock: 0 },
      { id: 'p2_500g', name: '500g', priceUSD: 0, priceBs: 0, stock: 0 },
    ],
  },
  {
    name: 'Crema Facial Aloe Vera & Vitamina E',
    category: 'Cremas',
    description: 'Crema facial hidratante con aloe vera y vitamina E',
    imageUri: '',
    presentations: [
      { id: 'p3_60g', name: '60g', priceUSD: 0, priceBs: 0, stock: 0 },
      { id: 'p3_120g', name: '120g', priceUSD: 0, priceBs: 0, stock: 0 },
      { id: 'p3_350g', name: '350g', priceUSD: 0, priceBs: 0, stock: 0 },
      { id: 'p3_500g', name: '500g', priceUSD: 0, priceBs: 0, stock: 0 },
    ],
  },
  {
    name: 'Aceite Rompe Dolor',
    category: 'Aceites',
    description: 'Aceite analgésico para masajes y alivio de dolores',
    imageUri: '',
    presentations: [
      { id: 'p4_30ml', name: '30ml', priceUSD: 0, priceBs: 0, stock: 0 },
      { id: 'p4_60ml', name: '60ml', priceUSD: 0, priceBs: 0, stock: 0 },
      { id: 'p4_120ml', name: '120ml', priceUSD: 0, priceBs: 0, stock: 0 },
      { id: 'p4_250ml', name: '250ml', priceUSD: 0, priceBs: 0, stock: 0 },
    ],
  },
];

class ProductsService {
  async initializeProducts(): Promise<void> {
    try {
      const isInitialized = await storageService.isInitialized();
      
      if (!isInitialized) {
        const products = INITIAL_PRODUCTS.map((p, index) => ({
          ...p,
          id: `product_${index + 1}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }));
        await storageService.saveProducts(products);
        await storageService.setInitialized();
        console.log('[Storage] Initialized with default products');
      }
    } catch (error) {
      console.error('Error initializing products:', error);
    }
  }

  async getProducts(): Promise<Product[]> {
    return storageService.getProducts();
  }

  async getProductById(id: string): Promise<Product | null> {
    const products = await storageService.getProducts();
    return products.find(p => p.id === id) || null;
  }

  async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const products = await storageService.getProducts();
    const newProduct: Product = {
      ...productData,
      id: `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    products.push(newProduct);
    await storageService.saveProducts(products);
    return newProduct;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const products = await storageService.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;

    const updatedProduct = {
      ...products[index],
      ...updates,
      updatedAt: Date.now(),
    };
    products[index] = updatedProduct;
    await storageService.saveProducts(products);
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const products = await storageService.getProducts();
    const filteredProducts = products.filter(p => p.id !== id);
    if (filteredProducts.length === products.length) return false;
    await storageService.saveProducts(filteredProducts);
    return true;
  }

  async updateStock(productId: string, presentationId: string, quantity: number): Promise<Product | null> {
    const product = await this.getProductById(productId);
    if (!product) return null;

    const presentations = product.presentations.map(p => {
      if (p.id === presentationId) {
        return { ...p, stock: Math.max(0, p.stock - quantity) };
      }
      return p;
    });

    return this.updateProduct(productId, { presentations });
  }
}

export const productsService = new ProductsService();
