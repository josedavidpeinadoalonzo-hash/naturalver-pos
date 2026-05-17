// Modelos de datos para NaturalVer's

export interface ProductPresentation {
  id: string;
  name: string; // Ejemplo: "60g", "30ml", "Pack x3"
  priceUSD: number;   // Precio en dólares (soporta decimales: 1, 1.5, 2.50)
  priceBs: number;    // Precio en Bolívares (individual, NO calculado automáticamente)
  stock: number;
  lowStockThreshold?: number; // Umbral para alertas de stock bajo (default: 5)
  // Precios multinivel
  wholesalePrice?: number;   // Precio al mayor (USD)
  resellerPrice?: number;    // Precio revendedor (USD)
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description?: string;
  imageUri?: string;
  barcode?: string; // Código de barras del producto
  presentations: ProductPresentation[];
  createdAt: number;
  updatedAt: number;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string; // Nombre histórico
  presentationId: string; // ID de la presentación vendida
  presentationName: string; // Nombre histórico (ej: "30ml")
  quantity: number;
  paymentType: 'mobile' | 'cash' | 'mixed' | 'credit';
  totalAmountUSD: number;
  totalAmountBS: number;
  exchangeRate: number; // Tasa BCV usada en la venta
  mobileAmountBS?: number;
  cashAmountUSD?: number;
  isWholesale: boolean;
  wholesaleDiscount?: number;
  customerName?: string;
  customerPhone?: string;
  debtId?: string; // Si la venta fue a crédito
  createdAt: number;
}

// === GESTIÓN DE CLIENTES ===
export interface Customer {
  id: string;
  name: string;
  idCard: string; // CI o RIF
  address?: string;
  phone?: string;
  email?: string;
  createdAt: number;
  updatedAt: number;
}

// === GESTIÓN DE DEUDAS ("El Fiao") ===
export interface DebtPayment {
  id: string;
  amount: number;     // Monto del abono (USD)
  amountBS: number;   // Monto en Bolívares
  paymentType: 'mobile' | 'cash' | 'mixed';
  exchangeRate: number;
  note?: string;
  createdAt: number;
}

export interface Debt {
  id: string;
  customerName: string;
  customerPhone?: string;
  saleId?: string;         // ID de la venta original
  productName: string;     // Nombre del producto vendido
  totalAmountUSD: number;  // Monto total de la deuda
  paidAmountUSD: number;   // Monto pagado hasta ahora
  remainingUSD: number;    // Lo que falta por pagar
  status: 'pending' | 'partial' | 'paid';
  payments: DebtPayment[];
  dueDate?: number;        // Fecha límite de pago
  createdAt: number;
  updatedAt: number;
}

// === REGISTRO DE GASTOS ===
export type ExpenseCategory = 'transporte' | 'mercancia' | 'servicios' | 'alquiler' | 'empaque' | 'otro';

export interface Expense {
  id: string;
  description: string;
  category: ExpenseCategory;
  amountUSD: number;
  amountBS: number;
  exchangeRate: number;
  paymentType: 'mobile' | 'cash' | 'mixed';
  note?: string;
  createdAt: number;
}

// === CIERRE DE CAJA ===
export interface CashClose {
  id: string;
  date: string;               // YYYY-MM-DD
  openingBalanceUSD: number;
  closingBalanceUSD: number;
  totalSalesUSD: number;
  totalSalesBS?: number;
  totalExpensesUSD: number;
  totalDebtCollectedUSD?: number;
  netProfitUSD: number;
  cashInHand?: number;         // Efectivo $ que debería haber
  mobileBalance?: number;      // Bs en banco que debería haber
  salesCount?: number;
  exchangeRate: number;
  status: 'open' | 'closed';
  createdAt: number;
}

// === CONFIGURACIÓN DE EMPRESA ===
export interface CompanyConfig {
  name: string;
  rif: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUri?: string;
}

// === PLANTILLAS DE WHATSAPP ===
export interface MessageTemplate {
  id: string;
  title: string;      // Ej: "Datos de Pago", "Ubicación"
  content: string;    // El cuerpo del mensaje
  category: 'payment' | 'location' | 'greeting' | 'other';
  createdAt: number;
}

export interface DailySummary {
  date: string; // YYYY-MM-DD
  totalSales: number;
  totalMobileIncome: number;
  totalMobileIncomeBS?: number; // Monto real en Bs
  totalCashIncome: number;
  productsCount: number;
  salesCount: number;
}

export interface WeeklySummary {
  weekStart: string; // YYYY-MM-DD
  weekEnd: string; // YYYY-MM-DD
  totalSales: number;
  totalMobileIncome: number;
  totalMobileIncomeBS?: number;
  totalCashIncome: number;
  productsCount: number;
  salesCount: number;
}

export interface MonthlySummary {
  month: string; // YYYY-MM
  totalSales: number;
  totalMobileIncome: number;
  totalMobileIncomeBS?: number;
  totalCashIncome: number;
  productsCount: number;
  salesCount: number;
}

export interface AppState {
  products: Product[];
  sales: Sale[];
  debts: Debt[];
  expenses: Expense[];
  cashCloses: CashClose[];
  customers: Customer[];
  templates: MessageTemplate[];
  companyConfig: CompanyConfig | null;
  dailySummary: DailySummary | null;
  weeklySummary: WeeklySummary | null;
  monthlySummary: MonthlySummary | null;
  loading: boolean;
  error: string | null;
  exchangeRate: number;
}
