# Diseño de Interfaz - NaturalVer's

## Orientación y Contexto
- **Orientación**: Retrato (9:16)
- **Uso**: Una mano (vendedor ambulante en transporte público)
- **Tema**: Oscuro elegante con acentos verdes naturales
- **Paleta de Colores**:
  - Fondo: #151718 (gris oscuro profundo)
  - Superficie: #1e2022 (gris oscuro más claro)
  - Acento primario: #10B981 (verde natural/esmeralda)
  - Texto principal: #ECEDEE (blanco grisáceo)
  - Texto secundario: #9BA1A6 (gris claro)
  - Éxito: #34D399 (verde claro)
  - Error: #F87171 (rojo)
  - Advertencia: #FBBF24 (ámbar)

## Lista de Pantallas

### 1. **Dashboard Principal** (Home)
- **Contenido**:
  - Resumen del día: Ventas totales, ingresos en dólares físicos, ingresos por pago móvil
  - Cantidad de productos vendidos hoy
  - Tarjeta de resumen semanal (comparativa con semana anterior)
  - Tarjeta de resumen mensual
  - Botón flotante grande: "Nueva Venta" (acceso rápido)
  - Gráfico simple de ventas por hora (últimas 8 horas)
  - Botón de acceso rápido a reportes

### 2. **Registro Rápido de Ventas** (Modal/Pantalla)
- **Contenido**:
  - Selector de producto (grid 2x2 con imagen, nombre, precio)
  - Cantidad (spinner o input numérico)
  - Tipo de pago: Pago Móvil / Dólares Físicos / Mixto (tabs o botones)
  - Si es mixto: campos para ingresar monto en cada tipo
  - Cálculo automático del total
  - Botón "Registrar Venta" (verde, grande, 60% ancho)
  - Botón "Cancelar" (gris, 35% ancho)
  - Historial de últimas 5 ventas (scroll horizontal)

### 3. **Gestión de Productos**
- **Contenido**:
  - Lista de productos (cards con imagen, nombre, categoría, precio BCV, precio USD, stock)
  - Botón flotante: "Agregar Producto"
  - Búsqueda/filtro por categoría
  - Cada card tiene botones: Editar, Eliminar

### 4. **Detalle/Edición de Producto**
- **Contenido**:
  - Imagen (grande, con opción de cambiar)
  - Nombre (editable)
  - Categoría (dropdown)
  - Precio BCV (editable)
  - Precio USD (editable)
  - Stock actual (editable)
  - Botones: Guardar, Cancelar, Eliminar

### 5. **Ventas al Mayor**
- **Contenido**:
  - Selector de producto (igual que registro rápido)
  - Cantidad (para aplicar descuento)
  - Descuento automático (mostrar % según cantidad)
  - Nombre del cliente (opcional)
  - Teléfono del cliente (opcional)
  - Tipo de pago (Pago Móvil / Dólares / Mixto)
  - Total con descuento aplicado
  - Botón "Registrar Venta al Mayor"

### 6. **Reportes**
- **Contenido**:
  - Tabs: Diario / Semanal / Mensual
  - Resumen de ventas (tabla: fecha, producto, cantidad, ingresos)
  - Botón "Exportar a Excel"
  - Botón "Exportar a PDF"
  - Gráfico de ventas por producto

### 7. **Estadísticas**
- **Contenido**:
  - Producto más vendido (card destacada)
  - Ventas por día (gráfico de barras)
  - Ingresos por tipo de pago (gráfico de pastel)
  - Comparativa semanal/mensual
  - Tabla de top 5 productos

### 8. **Configuración**
- **Contenido**:
  - Tema (oscuro/claro)
  - Moneda por defecto (BCV/USD)
  - Datos de la tienda (nombre, teléfono)
  - Respaldo de datos
  - Información de la app

## Flujos de Usuario Principales

### Flujo 1: Registrar Venta Rápida
1. Usuario abre app → Dashboard
2. Toca botón "Nueva Venta" (flotante)
3. Se abre modal de registro rápido
4. Selecciona producto (toca card)
5. Ingresa cantidad
6. Selecciona tipo de pago
7. Toca "Registrar Venta"
8. Venta se guarda, modal cierra, dashboard se actualiza

### Flujo 2: Venta al Mayor
1. Usuario navega a "Ventas al Mayor" (tab o menú)
2. Selecciona producto
3. Ingresa cantidad (se calcula descuento automático)
4. Ingresa datos del cliente (opcional)
5. Selecciona tipo de pago
6. Toca "Registrar Venta al Mayor"
7. Se guarda con descuento aplicado

### Flujo 3: Gestionar Productos
1. Usuario navega a "Productos"
2. Ve lista de productos
3. Toca un producto para editar
4. Modifica datos (precio, stock, imagen)
5. Toca "Guardar"
6. Vuelve a lista

### Flujo 4: Ver Reportes
1. Usuario navega a "Reportes"
2. Selecciona período (diario/semanal/mensual)
3. Ve tabla de ventas
4. Toca "Exportar a Excel" o "Exportar a PDF"
5. Archivo se descarga

## Componentes Reutilizables

- **ProductCard**: Muestra imagen, nombre, categoría, precios, stock
- **SalesSummaryCard**: Resumen de ventas (número grande + etiqueta)
- **PaymentTypeSelector**: Tabs para seleccionar tipo de pago
- **QuantityInput**: Spinner o input para cantidad
- **PrimaryButton**: Botón verde grande (acciones principales)
- **SecondaryButton**: Botón gris (acciones secundarias)
- **ChartComponent**: Gráficos simples (barras, pastel)

## Consideraciones de UX

1. **Velocidad**: Botones grandes, accesibles con una mano
2. **Feedback**: Haptics al registrar venta, animaciones suaves
3. **Offline**: Toda la app funciona sin internet
4. **Contraste**: Texto claro sobre fondo oscuro
5. **Iconografía**: Iconos simples y claros (Material Icons)
6. **Accesibilidad**: Tamaños de texto legibles (mínimo 14sp)
