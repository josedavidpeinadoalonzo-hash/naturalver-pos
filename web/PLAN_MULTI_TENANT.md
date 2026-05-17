# Plan Multi-Tenant NaturalVer's

## Negocios

| Slug | Nombre | Estado |
|---|---|---|
| `bodega-derwin` | Distribuidora DC | ✅ Activo |
| `heladeria` | Heladería | ✅ Creado |
| `kiosco` | Kiosco | ✅ Creado |

## Módulos Implementados

### Multi-Tenant (Fase 0)
- Tabla `businesses` con slug único
- `business_id` en TODAS las tablas (products, sales, debts, expenses, cash_closes, invoices, templates, employees, purchase_orders, colombia_purchases, currency_purchases, cash_advances)
- `BusinessProvider` + `useBusiness()` hook
- `tenantQuery()` helper para consultas filtradas
- BusinessSelector (sidebar + mobile header)
- BusinessLogin (pantalla de selección de negocio)
- EmployeeStore filtrado por business_id
- Login dual: Business → Employee PIN → Dashboard

### Código de Barras + Stock (Fase 1.1)
- Campo `barcode` en products
- Escáner por cámara (`BarcodeDetector`) en venta rápida
- Si código no encontrado → enlace para crear producto
- `lowStockThreshold` configurable por presentación
- Stock se descuenta al vender
- Dashboard muestra alertas de stock bajo

### Multi-monedas (Fase 1.2)
- Precios en USD, Bs y COP por presentación
- Tasa BCV automática (API dolarapi.com)
- Tasa COP/USD configurable manualmente
- Formato de monedas: USD, Bs (VES), COP

### Actualización Automática de Precios (Fase 1.3)
- Al cargar dashboard: obtiene tasa BCV
- Actualiza `price_bs = price_usd * bcv_rate` en todos los productos
- Toast de confirmación con cantidad de productos actualizados
- Solo admin ejecuta la actualización

### Órdenes de Compra / Compras Colombia (Fase 1.4 + 1.5)
- `/compras` — listado de compras locales y Colombia
- `/compras/new` — formulario con dos modos (local/colombia)
- Compras locales: costo con IVA + extracción automática de IVA 16%
- Compras Colombia: costo en COP → conversión automática a USD/Bs
- NO genera documento fiscal (Colombia)
- Aparece en Cierre de Caja como inversión

### Punto de Venta como método de pago (Fase 1.6)
- Nuevo tipo `pos` en payment_type
- Input: número de aprobación, banco, débito/crédito
- Columnas `payment_reference`, `payment_bank`, `card_type` en sales

### Compra de Divisas (Fase 1.7)
- `/divisas` — registro de compra de USD o COP
- Usuario ingresa monto + tasa manual pactada
- Sin comisión (compra directa)
- Sistema descuenta Bs, suma a posición USD/COP
- Historial de operaciones

### Avance de Efectivo (Fase 1.8)
- `/avances` — registro de avances
- Cliente paga con tarjeta en POS bancario, recibe Bs en efectivo
- Comisión opcional 10-20%
- Campos: monto USD, comisión %, tarjeta (débito/crédito), banco, código aprobación
- Historial de avances

### Cierre de Caja Avanzado (Fase 1.9)
- Balance inicial (Bs, USD, COP)
- Ventas del día (efectivo Bs, efectivo USD, POS, crédito)
- Compra de divisas (USD/COP comprados, total Bs pagado)
- Avances de efectivo (Bs entregado, comisiones ganadas)
- Inversión mercancía (local + Colombia)
- Gastos
- Posición final (Bs, USD, COP) + ganancia neta

## Esquema de Base de Datos

Tablas principales:
- `businesses` — negocios multi-tenant
- `business_config` — configuración por negocio
- `products` — productos con presentaciones (JSONB), barcode
- `sales` — ventas con payment_reference, card_type
- `debts` / `debt_payments` — deudas (fiao)
- `expenses` — gastos
- `cash_closes` — cierres de caja
- `employees` — empleados con PIN
- `templates` — plantillas WhatsApp
- `company_config` — configuración por negocio
- `purchase_orders` — órdenes de compra locales
- `colombia_purchases` — compras Colombia no declaradas
- `currency_purchases` — compra de divisas
- `cash_advances` — avances de efectivo

## URLs

- Producción: https://naturalver-web.vercel.app
- Supabase: https://trnbgsixswqniiuusgdh.supabase.co

## Reporte Z (Implementado)

- **Migración `00005_reportez.sql`**: campos `invoice_number`, `control_number`, `rif_cliente`, `iva_percentage`, `iva_amount`, `taxable_amount`, `exempt_amount`, `document_type` en sales
- **Generador XML**: `src/lib/reportez/generator.ts` — produce XML formato SENIAT para Libro de Ventas (`<LibroVentas>`) y Libro de Compras (`<LibroCompras>`)
- **Página `/reportez`**: selector de mes/año, resumen (ventas USD + compras), descarga de ambos XML con nombre estándar `RIF_AAAAMM_LV.XML` / `RIF_AAAAMM_LC.XML`
- **Venta al Mayor actualizada**: guarda `invoice_number`, `control_number`, `rif_cliente`, `iva_percentage`, `iva_amount`, `taxable_amount` al facturar
- **Quick Sale**: sin RIF usa "V-99999999" (Consumidor Final), sin IVA explícito

## Pendiente

- Heladería y Kiosco: crear productos/categorías específicas
- Configuración de dominio Resend para emails
- Migrar todo a código fuente abierto
