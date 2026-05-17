import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AppState, Product, Sale, Debt, Expense, CashClose, DailySummary, WeeklySummary, MonthlySummary } from '@/lib/models';
import { storageService } from '@/lib/services/storage.service';
import { productsService } from '@/lib/services/products.service';
import { salesService } from '@/lib/services/sales.service';
import { bcvService } from '@/lib/services/bcv.service';
import { debtService } from '@/lib/services/debt.service';
import { expenseService } from '@/lib/services/expense.service';
import { templatesService } from '@/lib/services/templates.service';
import { MessageTemplate } from '@/lib/models';

type AppAction =
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'SET_SALES'; payload: Sale[] }
  | { type: 'ADD_SALE'; payload: Sale }
  | { type: 'SET_DEBTS'; payload: Debt[] }
  | { type: 'SET_EXPENSES'; payload: Expense[] }
  | { type: 'SET_CASH_CLOSES'; payload: CashClose[] }
  | { type: 'SET_DAILY_SUMMARY'; payload: DailySummary }
  | { type: 'SET_WEEKLY_SUMMARY'; payload: WeeklySummary }
  | { type: 'SET_MONTHLY_SUMMARY'; payload: MonthlySummary }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_EXCHANGE_RATE'; payload: number }
  | { type: 'SET_CUSTOMERS'; payload: any[] }
  | { type: 'SET_CONFIG'; payload: any }
  | { type: 'SET_TEMPLATES'; payload: any[] }
  | { type: 'RESET_STATE' };

const initialState: AppState = {
  products: [],
  sales: [],
  debts: [],
  expenses: [],
  cashCloses: [],
  dailySummary: null,
  weeklySummary: null,
  monthlySummary: null,
  loading: true,
  error: null,
  exchangeRate: 0,
  customers: [],
  templates: [],
  companyConfig: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    case 'SET_SALES':
      return { ...state, sales: action.payload };
    case 'ADD_SALE':
      return { ...state, sales: [...state.sales, action.payload] };
    case 'SET_DEBTS':
      return { ...state, debts: action.payload };
    case 'SET_EXPENSES':
      return { ...state, expenses: action.payload };
    case 'SET_CASH_CLOSES':
      return { ...state, cashCloses: action.payload };
    case 'SET_DAILY_SUMMARY':
      return { ...state, dailySummary: action.payload };
    case 'SET_WEEKLY_SUMMARY':
      return { ...state, weeklySummary: action.payload };
    case 'SET_MONTHLY_SUMMARY':
      return { ...state, monthlySummary: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_EXCHANGE_RATE':
      return { ...state, exchangeRate: action.payload };
    case 'SET_CUSTOMERS':
      return { ...state, customers: action.payload };
    case 'SET_CONFIG':
      return { ...state, companyConfig: action.payload };
    case 'SET_TEMPLATES':
      return { ...state, templates: action.payload };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  loadAppData: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  recordSale: (
    productId: string,
    presentationId: string,
    quantity: number,
    paymentType: 'mobile' | 'cash' | 'mixed' | 'credit',
    totalAmountUSD: number,
    totalAmountBS: number,
    exchangeRate: number,
    mobileAmountBS?: number,
    cashAmountUSD?: number,
    isWholesale?: boolean,
    wholesaleDiscount?: number,
    customerName?: string,
    customerPhone?: string
  ) => Promise<Sale>;
  refreshSummaries: () => Promise<void>;
  refreshDebts: () => Promise<void>;
  refreshExpenses: () => Promise<void>;
  refreshCustomers: () => Promise<void>;
  refreshConfig: () => Promise<void>;
  refreshTemplates: () => Promise<void>;
  addTemplate: (template: Omit<MessageTemplate, 'id' | 'createdAt'>) => Promise<void>;
  updateTemplate: (id: string, updates: Partial<MessageTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  clearAllData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const loadAppData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await productsService.initializeProducts();
      await templatesService.initializeTemplates();
      const products = await storageService.getProducts();
      const sales = await storageService.getSales();
      const debts = await storageService.getDebts();
      const expenses = await storageService.getExpenses();
      const cashCloses = await storageService.getCashCloses();

      dispatch({ type: 'SET_PRODUCTS', payload: products });
      dispatch({ type: 'SET_SALES', payload: sales });
      dispatch({ type: 'SET_DEBTS', payload: debts });
      dispatch({ type: 'SET_EXPENSES', payload: expenses });
      dispatch({ type: 'SET_CASH_CLOSES', payload: cashCloses });
      
      const customers = await storageService.getCustomers();
      const config = await storageService.getCompanyConfig();
      const templates = await storageService.getTemplates();
      
      dispatch({ type: 'SET_CUSTOMERS', payload: customers });
      dispatch({ type: 'SET_CONFIG', payload: config });
      dispatch({ type: 'SET_TEMPLATES', payload: templates });
      
      // Fetch exchange rate
      try {
        const rate = await bcvService.getLatestRate();
        dispatch({ type: 'SET_EXCHANGE_RATE', payload: rate });
      } catch (e) {
        console.error('Error fetching rate in context:', e);
      }

      await refreshSummaries();
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      console.error('Error loading app data:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error al cargar datos' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await productsService.createProduct(productData);
      const products = await storageService.getProducts();
      dispatch({ type: 'SET_PRODUCTS', payload: products });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al agregar producto';
      console.error('Error adding product:', error);
      dispatch({ type: 'SET_ERROR', payload: msg });
      throw error;
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      await productsService.updateProduct(id, updates);
      const products = await storageService.getProducts();
      dispatch({ type: 'SET_PRODUCTS', payload: products });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al actualizar producto';
      console.error('Error updating product:', error);
      dispatch({ type: 'SET_ERROR', payload: msg });
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await productsService.deleteProduct(id);
      const products = await storageService.getProducts();
      dispatch({ type: 'SET_PRODUCTS', payload: products });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al eliminar producto';
      console.error('Error deleting product:', error);
      dispatch({ type: 'SET_ERROR', payload: msg });
      throw error;
    }
  };

  const recordSale = async (
    productId: string,
    presentationId: string,
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
  ): Promise<Sale> => {
    try {
      const product = state.products.find(p => p.id === productId);
      const presentation = product?.presentations.find(p => p.id === presentationId);
      
      const sale = await salesService.createSale(
        productId,
        product?.name || 'Producto Desconocido',
        presentationId,
        presentation?.name || 'Única',
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
        customerPhone
      );

      await productsService.updateStock(productId, presentationId, quantity);

      const sales = await storageService.getSales();
      const products = await storageService.getProducts();

      dispatch({ type: 'SET_SALES', payload: sales });
      dispatch({ type: 'SET_PRODUCTS', payload: products });

      await refreshSummaries();
      return sale;
    } catch (error) {
      console.error('Error recording sale:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error al registrar venta' });
      throw error;
    }
  };

  const refreshSummaries = async () => {
    try {
      const daily = await salesService.getDailySummary();
      const weekly = await salesService.getWeeklySummary();
      const monthly = await salesService.getMonthlySummary();

      dispatch({ type: 'SET_DAILY_SUMMARY', payload: daily });
      dispatch({ type: 'SET_WEEKLY_SUMMARY', payload: weekly });
      dispatch({ type: 'SET_MONTHLY_SUMMARY', payload: monthly });
    } catch (error) {
      console.error('Error refreshing summaries:', error);
    }
  };

  const refreshDebts = async () => {
    try {
      const debts = await storageService.getDebts();
      dispatch({ type: 'SET_DEBTS', payload: debts });
    } catch (error) {
      console.error('Error refreshing debts:', error);
    }
  };

  const refreshExpenses = async () => {
    try {
      const expenses = await storageService.getExpenses();
      dispatch({ type: 'SET_EXPENSES', payload: expenses });
      await refreshSummaries(); // Actualizar ganancia neta al instante
    } catch (error) {
      console.error('Error refreshing expenses:', error);
    }
  };

  const refreshCustomers = async () => {
    try {
      const customers = await storageService.getCustomers();
      dispatch({ type: 'SET_CUSTOMERS', payload: customers });
    } catch (error) {
      console.error('Error refreshing customers:', error);
    }
  };

  const refreshConfig = async () => {
    try {
      const config = await storageService.getCompanyConfig();
      dispatch({ type: 'SET_CONFIG', payload: config });
    } catch (error) {
      console.error('Error refreshing config:', error);
    }
  };

  const refreshTemplates = async () => {
    try {
      const templates = await templatesService.getTemplates();
      dispatch({ type: 'SET_TEMPLATES', payload: templates });
    } catch (error) {
      console.error('Error refreshing templates:', error);
    }
  };

  const addTemplate = async (templateData: Omit<MessageTemplate, 'id' | 'createdAt'>) => {
    try {
      await templatesService.createTemplate(templateData);
      await refreshTemplates();
    } catch (error) {
      console.error('Error adding template:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error al agregar plantilla' });
    }
  };

  const updateTemplate = async (id: string, updates: Partial<MessageTemplate>) => {
    try {
      await templatesService.updateTemplate(id, updates);
      await refreshTemplates();
    } catch (error) {
      console.error('Error updating template:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error al actualizar plantilla' });
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      await templatesService.deleteTemplate(id);
      await refreshTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error al eliminar plantilla' });
    }
  };

  const clearAllData = async () => {
    try {
      await storageService.clearAll();
      dispatch({ type: 'RESET_STATE' });
    } catch (error) {
      console.error('Error clearing data:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error al limpiar datos' });
    }
  };

  useEffect(() => {
    loadAppData();
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        loadAppData,
        addProduct,
        updateProduct,
        deleteProduct,
        recordSale,
        refreshSummaries,
        refreshDebts,
        refreshExpenses,
        refreshCustomers,
        refreshConfig,
        refreshTemplates,
        addTemplate,
        updateTemplate,
        deleteTemplate,
        clearAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe ser usado dentro de AppProvider');
  }
  return context;
}
