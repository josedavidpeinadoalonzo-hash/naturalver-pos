import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Wallet,
  Receipt,
  PiggyBank,
  FileBarChart,
  Settings,
  FileText,
  Globe,
  DollarSign,
  CreditCard,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

export const mainNav: NavItem[] = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/ventas/rapida", label: "POS", icon: ShoppingCart },
  { href: "/ventas/mayor", label: "Venta al Mayor", icon: ShoppingCart },
  { href: "/productos", label: "Productos", icon: Package },
  { href: "/clientes", label: "Clientes", icon: Users },
];

export const managementNav: NavItem[] = [
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/deudas", label: "Deudas (Fiao)", icon: Wallet },
  { href: "/gastos", label: "Gastos", icon: Receipt },
  { href: "/compras", label: "Compras", icon: FileText },
  { href: "/divisas", label: "Compra Divisas", icon: DollarSign },
  { href: "/avances", label: "Avance Efectivo", icon: CreditCard },
  { href: "/cierre", label: "Cierre de Caja", icon: PiggyBank },
  { href: "/reportes", label: "Reportes", icon: FileBarChart },
  { href: "/reportez", label: "Reporte Z", icon: FileText },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

export const mobileBottomNav: NavItem[] = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/ventas/rapida", label: "POS", icon: ShoppingCart },
  { href: "/productos", label: "Productos", icon: Package },
  { href: "/compras", label: "Compras", icon: FileText },
  { href: "/deudas", label: "Fiao", icon: Wallet },
];

export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}
