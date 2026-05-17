-- NaturalVer's - Mini Market Products for Distribuidora DC
-- All prices in USD

DO $$
DECLARE
  v_biz UUID := 'ee5c7651-189e-4cbb-a526-35a4b7c28743';
BEGIN

-- BEBIDAS
INSERT INTO products (business_id, name, category, presentations) VALUES
(v_biz, 'Agua Mineral 1.5L', 'Bebidas', '[{"id":"un","name":"Unidad","priceUSD":0.80,"priceBs":0,"stock":50,"lowStockThreshold":10}]'),
(v_biz, 'Coca-Cola 2L', 'Bebidas', '[{"id":"un","name":"Unidad","priceUSD":2.00,"priceBs":0,"stock":30,"lowStockThreshold":10}]'),
(v_biz, 'Coca-Cola Personal 355ml', 'Bebidas', '[{"id":"un","name":"Unidad","priceUSD":0.80,"priceBs":0,"stock":60,"lowStockThreshold":20}]'),
(v_biz, 'Pepsi 2L', 'Bebidas', '[{"id":"un","name":"Unidad","priceUSD":1.80,"priceBs":0,"stock":30,"lowStockThreshold":10}]'),
(v_biz, 'Maltín Polar 2L', 'Bebidas', '[{"id":"un","name":"Unidad","priceUSD":2.50,"priceBs":0,"stock":20,"lowStockThreshold":5}]'),
(v_biz, 'Jugo Natural de Naranja 1L', 'Bebidas', '[{"id":"un","name":"Unidad","priceUSD":1.50,"priceBs":0,"stock":25,"lowStockThreshold":10}]'),
(v_biz, 'Agua Saborizada 1.5L', 'Bebidas', '[{"id":"un","name":"Unidad","priceUSD":1.20,"priceBs":0,"stock":20,"lowStockThreshold":10}]');

-- ALIMENTOS BÁSICOS
INSERT INTO products (business_id, name, category, presentations) VALUES
(v_biz, 'Arroz 1kg', 'Alimentos', '[{"id":"kg1","name":"1 kg","priceUSD":1.20,"priceBs":0,"stock":40,"lowStockThreshold":10}]'),
(v_biz, 'Pasta Larga 500g', 'Alimentos', '[{"id":"pkg","name":"Paquete","priceUSD":0.80,"priceBs":0,"stock":40,"lowStockThreshold":10}]'),
(v_biz, 'Aceite Vegetal 1L', 'Alimentos', '[{"id":"lt1","name":"1 L","priceUSD":2.50,"priceBs":0,"stock":20,"lowStockThreshold":5}]'),
(v_biz, 'Azúcar 1kg', 'Alimentos', '[{"id":"kg1","name":"1 kg","priceUSD":1.00,"priceBs":0,"stock":30,"lowStockThreshold":10}]'),
(v_biz, 'Harina de Maíz 1kg', 'Alimentos', '[{"id":"kg1","name":"1 kg","priceUSD":1.50,"priceBs":0,"stock":25,"lowStockThreshold":10}]'),
(v_biz, 'Sal 500g', 'Alimentos', '[{"id":"pkg","name":"Paquete","priceUSD":0.50,"priceBs":0,"stock":30,"lowStockThreshold":10}]'),
(v_biz, 'Café Molido 250g', 'Alimentos', '[{"id":"pkg","name":"Paquete","priceUSD":2.00,"priceBs":0,"stock":20,"lowStockThreshold":5}]'),
(v_biz, 'Lentejas 500g', 'Alimentos', '[{"id":"pkg","name":"Paquete","priceUSD":1.20,"priceBs":0,"stock":20,"lowStockThreshold":5}]'),
(v_biz, 'Atún en Lata', 'Alimentos', '[{"id":"un","name":"Unidad","priceUSD":1.50,"priceBs":0,"stock":40,"lowStockThreshold":10}]'),
(v_biz, 'Sardinas en Lata', 'Alimentos', '[{"id":"un","name":"Unidad","priceUSD":1.00,"priceBs":0,"stock":30,"lowStockThreshold":10}]');

-- LÁCTEOS
INSERT INTO products (business_id, name, category, presentations) VALUES
(v_biz, 'Leche Completa 1L', 'Lácteos', '[{"id":"lt1","name":"1 L","priceUSD":1.80,"priceBs":0,"stock":30,"lowStockThreshold":10}]'),
(v_biz, 'Queso Blanco 500g', 'Lácteos', '[{"id":"g500","name":"500 g","priceUSD":3.00,"priceBs":0,"stock":15,"lowStockThreshold":5}]'),
(v_biz, 'Mantequilla 250g', 'Lácteos', '[{"id":"g250","name":"250 g","priceUSD":2.00,"priceBs":0,"stock":15,"lowStockThreshold":5}]'),
(v_biz, 'Yogurt Natural 1L', 'Lácteos', '[{"id":"lt1","name":"1 L","priceUSD":2.50,"priceBs":0,"stock":15,"lowStockThreshold":5}]'),
(v_biz, 'Huevos Blanco 12u', 'Lácteos', '[{"id":"caja","name":"Caja 12u","priceUSD":2.50,"priceBs":0,"stock":25,"lowStockThreshold":10}]');

-- PANADERÍA
INSERT INTO products (business_id, name, category, presentations) VALUES
(v_biz, 'Pan de Molde Blanco', 'Panadería', '[{"id":"pkg","name":"Paquete","priceUSD":1.80,"priceBs":0,"stock":15,"lowStockThreshold":5}]'),
(v_biz, 'Pan Canilla (unidad)', 'Panadería', '[{"id":"un","name":"Unidad","priceUSD":0.25,"priceBs":0,"stock":100,"lowStockThreshold":20}]'),
(v_biz, 'Galletas de Soda 200g', 'Panadería', '[{"id":"pkg","name":"Paquete","priceUSD":0.80,"priceBs":0,"stock":30,"lowStockThreshold":10}]'),
(v_biz, 'Galletas Dulces 150g', 'Panadería', '[{"id":"pkg","name":"Paquete","priceUSD":1.00,"priceBs":0,"stock":25,"lowStockThreshold":10}]');

-- ASEO PERSONAL
INSERT INTO products (business_id, name, category, presentations) VALUES
(v_biz, 'Jabón de Baño', 'Aseo Personal', '[{"id":"un","name":"Unidad","priceUSD":0.80,"priceBs":0,"stock":40,"lowStockThreshold":10}]'),
(v_biz, 'Shampoo 400ml', 'Aseo Personal', '[{"id":"un","name":"Unidad","priceUSD":2.50,"priceBs":0,"stock":20,"lowStockThreshold":5}]'),
(v_biz, 'Pasta Dental', 'Aseo Personal', '[{"id":"un","name":"Unidad","priceUSD":1.50,"priceBs":0,"stock":25,"lowStockThreshold":10}]'),
(v_biz, 'Desodorante', 'Aseo Personal', '[{"id":"un","name":"Unidad","priceUSD":2.00,"priceBs":0,"stock":20,"lowStockThreshold":5}]'),
(v_biz, 'Papel Higiénico 4u', 'Aseo Personal', '[{"id":"pkg","name":"Paquete 4u","priceUSD":1.50,"priceBs":0,"stock":40,"lowStockThreshold":10}]'),
(v_biz, 'Cepillo de Dientes', 'Aseo Personal', '[{"id":"un","name":"Unidad","priceUSD":1.00,"priceBs":0,"stock":20,"lowStockThreshold":10}]');

-- BOTANAS
INSERT INTO products (business_id, name, category, presentations) VALUES
(v_biz, 'Papas Fritas 70g', 'Botanas', '[{"id":"un","name":"Unidad","priceUSD":0.80,"priceBs":0,"stock":50,"lowStockThreshold":20}]'),
(v_biz, 'Chicles (unidad)', 'Botanas', '[{"id":"un","name":"Unidad","priceUSD":0.10,"priceBs":0,"stock":200,"lowStockThreshold":50}]'),
(v_biz, 'Chocolate en Barra', 'Botanas', '[{"id":"un","name":"Unidad","priceUSD":1.00,"priceBs":0,"stock":30,"lowStockThreshold":10}]'),
(v_biz, 'Maní Salado 100g', 'Botanas', '[{"id":"pkg","name":"Paquete","priceUSD":0.60,"priceBs":0,"stock":30,"lowStockThreshold":10}]'),
(v_biz, 'Caramelos (unidad)', 'Botanas', '[{"id":"un","name":"Unidad","priceUSD":0.05,"priceBs":0,"stock":500,"lowStockThreshold":100}]');

-- ASEO DEL HOGAR
INSERT INTO products (business_id, name, category, presentations) VALUES
(v_biz, 'Cloro 1L', 'Aseo Hogar', '[{"id":"lt1","name":"1 L","priceUSD":1.00,"priceBs":0,"stock":20,"lowStockThreshold":5}]'),
(v_biz, 'Detergente 500g', 'Aseo Hogar', '[{"id":"pkg","name":"Paquete","priceUSD":1.80,"priceBs":0,"stock":20,"lowStockThreshold":5}]'),
(v_biz, 'Lavavajillas 500ml', 'Aseo Hogar', '[{"id":"un","name":"Unidad","priceUSD":1.50,"priceBs":0,"stock":15,"lowStockThreshold":5}]'),
(v_biz, 'Desinfectante 1L', 'Aseo Hogar', '[{"id":"lt1","name":"1 L","priceUSD":1.20,"priceBs":0,"stock":15,"lowStockThreshold":5}]'),
(v_biz, 'Esponja de Cocina', 'Aseo Hogar', '[{"id":"un","name":"Unidad","priceUSD":0.30,"priceBs":0,"stock":30,"lowStockThreshold":10}]');

-- CARNES / EMBUTIDOS
INSERT INTO products (business_id, name, category, presentations) VALUES
(v_biz, 'Jamón de Pollo 250g', 'Embutidos', '[{"id":"g250","name":"250 g","priceUSD":2.50,"priceBs":0,"stock":15,"lowStockThreshold":5}]'),
(v_biz, 'Salchichas 6u', 'Embutidos', '[{"id":"pkg","name":"Paquete 6u","priceUSD":2.00,"priceBs":0,"stock":15,"lowStockThreshold":5}]'),
(v_biz, 'Mortadela 250g', 'Embutidos', '[{"id":"g250","name":"250 g","priceUSD":1.80,"priceBs":0,"stock":15,"lowStockThreshold":5}]');

END $$;
