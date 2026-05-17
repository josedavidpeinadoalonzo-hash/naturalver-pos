# NaturalVer's - Aplicación de Gestión de Ventas Profesionales

## Progreso Actual

### ✅ Completado (Fases 1-6)

**Fase 1: Configuración Base y Arquitectura**
- Estructura fundamental del proyecto.
- Persistencia con AsyncStorage.
- Estado global con Context + useReducer.

**Fase 2: Capa de Datos y Modelos**
- Modelos de datos profesionales (Product, Sale, Summaries).
- Gestión de Tasa BCV con actualización automática cada 1 hora.

**Fase 3: Gestión de Productos (Individualizada)**
- CRUD completo de productos.
- **Precios Independientes**: Soporte para fijar precios en USD y Bs de forma individual para cada presentación.
- Manejo de decimales robusto ($1.50).

**Fase 4: Ventas y Recibos WhatsApp**
- Registro rápido de ventas.
- **Recibos Digitales**: Generación automática de comprobantes profesionales enviados por WhatsApp.
- Ventas al mayor con descuentos automáticos.

**Fase 5: Finanzas y Gastos**
- Registro de gastos por categoría.
- Módulo de deudas ("El Fiao") y gestión de abonos.
- Cálculo de ganancia neta diaria considerando ventas y gastos.

**Fase 6: Branding y Compilación**
- **Renombramiento**: Migración de VitaVentas a **NaturalVer's**.
- Compilación de APK automatizada integrada con el JDK de Android Studio.

**Fase 7: Centro de Atención (WhatsApp)**
- Plantillas de mensajes configurables (Pagos, Ubicación) con soporte para variables ([CLIENTE], [SALDO]).
- Recordatorios de cobranza por un solo toque integrados en el módulo de deudas.
- Acceso rápido a plantillas post-venta y catálogo compartido.

**Fase 8: Reportes Avanzados**
- Exportación a Excel (.xlsx) de las ventas con detalle de productos y métodos de pago.
- Cierre de caja inteligente: Generación de resumen para compartir vía WhatsApp al administrador.

**Fase 9: Gestión de Inventario Pro & Dashboard**
- Gráfico semanal animado (WeeklyChart) para visualizar el rendimiento de ventas.
- Indicadores inteligentes de stock (Crítico/Bajo) en el Dashboard e Inventario.
- Visibilidad de inventario en tiempo real durante el proceso de venta rápida.

### ✅ Completado (v1.2.0)

**Fase 10: Pulido Final y Estabilidad**
- Auditoría técnica completa: Eliminación de archivos redundantes y unificación de branding.
- Optimización de UI: Mejora de tiempos de respuesta en el Dashboard y Reportes.
- Estabilidad: Validación de persistencia de datos y estados globales.

---

## Características Clave Implementadas

- ✅ **Doble Moneda**: Gestión total en USD y Bs sin depender de cálculos automáticos.
- ✅ **Recibos WhatsApp**: Envío de comprobantes profesionales al instante.
- ✅ **Offline-First**: Funciona sin internet para registros de venta.
- ✅ **Dashboard Inteligente**: Gráfico semanal animado y alertas de stock bajo.
- ✅ **Centro de WhatsApp**: Plantillas configurables y cierre de caja compartido.
- ✅ **Marca Propia**: Branding personalizado para NaturalVer's.

## Estado Final
- **Versión**: 1.2.0 (Producción)
- **APK**: Lista para generación final v1.2.0.
- **Plataforma**: Android.
