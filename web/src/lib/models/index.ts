export interface ProductPresentation {
  id: string;
  name: string;
  priceUSD: number;
  priceBs: number;
  priceCop?: number;
  stock: number;
  lowStockThreshold?: number;
  wholesalePrice?: number;
  resellerPrice?: number;
  pricePremium?: number;
  priceDistributor?: number;
  exento?: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description?: string;
  image_url?: string;
  barcode?: string;
  exchangeRateCop?: number;
  presentations: ProductPresentation[];
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  product_id: string;
  product_name: string;
  presentation_id: string;
  presentation_name: string;
  quantity: number;
  payment_type: "mobile" | "cash" | "mixed" | "credit";
  total_amount_usd: number;
  total_amount_bs: number;
  exchange_rate: number;
  mobile_amount_bs?: number;
  cash_amount_usd?: number;
  is_wholesale: boolean;
  wholesale_discount?: number;
  customer_name?: string;
  customer_phone?: string;
  debt_id?: string;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  id_card: string;
  address?: string;
  phone?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface DebtPayment {
  id: string;
  debt_id: string;
  amount_usd: number;
  amount_bs: number;
  payment_type: "mobile" | "cash" | "mixed";
  exchange_rate: number;
  note?: string;
  created_at: string;
}

export interface Debt {
  id: string;
  customer_name: string;
  customer_phone?: string;
  sale_id?: string;
  product_name: string;
  total_amount_usd: number;
  paid_amount_usd: number;
  remaining_usd: number;
  status: "pending" | "partial" | "paid";
  payments: DebtPayment[];
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export type ExpenseCategory = "transporte" | "mercancia" | "servicios" | "alquiler" | "empaque" | "otro";

export interface Expense {
  id: string;
  description: string;
  category: ExpenseCategory;
  amount_usd: number;
  amount_bs: number;
  exchange_rate: number;
  payment_type: "mobile" | "cash" | "mixed";
  note?: string;
  created_at: string;
}

export interface CashClose {
  id: string;
  date: string;
  opening_balance_usd: number;
  closing_balance_usd: number;
  total_sales_usd: number;
  total_sales_bs?: number;
  total_expenses_usd: number;
  total_debt_collected_usd?: number;
  net_profit_usd: number;
  cash_in_hand?: number;
  mobile_balance?: number;
  sales_count?: number;
  exchange_rate: number;
  status: "open" | "closed";
  created_at: string;
}

export interface CompanyConfig {
  id: string;
  name: string;
  rif: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
}

export interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  category: "payment" | "location" | "greeting" | "other";
  created_at: string;
}
