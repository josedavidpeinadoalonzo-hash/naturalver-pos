-- Seed data for NaturalVer's
-- Run after migrations

-- Default products (only if table is empty)
INSERT INTO products (name, category, description, presentations)
SELECT 'Crema Rompe Dolor', 'Cremas', 'Crema analgésica para aliviar dolores musculares y articulares',
 '[{"id":"p1_60g","name":"60g","priceUSD":0,"priceBs":0,"stock":0},{"id":"p1_120g","name":"120g","priceUSD":0,"priceBs":0,"stock":0},{"id":"p1_350g","name":"350g","priceUSD":0,"priceBs":0,"stock":0},{"id":"p1_500g","name":"500g","priceUSD":0,"priceBs":0,"stock":0}]'
WHERE NOT EXISTS (SELECT 1 FROM products);

INSERT INTO products (name, category, description, presentations)
SELECT 'Crema Milagrosa de Azufre', 'Cremas', 'Crema con azufre para tratamientos dermatológicos',
 '[{"id":"p2_60g","name":"60g","priceUSD":0,"priceBs":0,"stock":0},{"id":"p2_120g","name":"120g","priceUSD":0,"priceBs":0,"stock":0},{"id":"p2_350g","name":"350g","priceUSD":0,"priceBs":0,"stock":0},{"id":"p2_500g","name":"500g","priceUSD":0,"priceBs":0,"stock":0}]'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Crema Milagrosa de Azufre');

INSERT INTO products (name, category, description, presentations)
SELECT 'Crema Facial Aloe Vera & Vitamina E', 'Cremas', 'Crema facial hidratante con aloe vera y vitamina E',
 '[{"id":"p3_60g","name":"60g","priceUSD":0,"priceBs":0,"stock":0},{"id":"p3_120g","name":"120g","priceUSD":0,"priceBs":0,"stock":0},{"id":"p3_350g","name":"350g","priceUSD":0,"priceBs":0,"stock":0},{"id":"p3_500g","name":"500g","priceUSD":0,"priceBs":0,"stock":0}]'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Crema Facial Aloe Vera & Vitamina E');

INSERT INTO products (name, category, description, presentations)
SELECT 'Aceite Rompe Dolor', 'Aceites', 'Aceite analgésico para masajes y alivio de dolores',
 '[{"id":"p4_30ml","name":"30ml","priceUSD":0,"priceBs":0,"stock":0},{"id":"p4_60ml","name":"60ml","priceUSD":0,"priceBs":0,"stock":0},{"id":"p4_120ml","name":"120ml","priceUSD":0,"priceBs":0,"stock":0},{"id":"p4_250ml","name":"250ml","priceUSD":0,"priceBs":0,"stock":0}]'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Aceite Rompe Dolor');

-- Default WhatsApp templates
INSERT INTO templates (title, content, category)
SELECT 'Datos de Pago Móvil',
 E'🌿 *NATURALVER''S - DATOS DE PAGO*\n\n✅ *Pago Móvil*\n🏦 Banco: [Nombre del Banco]\n🆔 CI: [Cédula]\n📱 Teléfono: [Teléfono]\n\nFavor enviar comprobante al realizar el pago. ¡Gracias! 🙏',
 'payment'
WHERE NOT EXISTS (SELECT 1 FROM templates WHERE title = 'Datos de Pago Móvil');

INSERT INTO templates (title, content, category)
SELECT 'Ubicación y Horario',
 E'📍 *NUESTRA UBICACIÓN*\n[Dirección completa aquí]\n\n⏰ *Horario de Atención*\nLunes a Viernes: 8:00 AM - 5:00 PM\nSábados: 9:00 AM - 1:00 PM\n\n¡Te esperamos! 🌿',
 'location'
WHERE NOT EXISTS (SELECT 1 FROM templates WHERE title = 'Ubicación y Horario');

INSERT INTO templates (title, content, category)
SELECT 'Agradecimiento de Compra',
 E'✨ *¡GRACIAS POR TU COMPRA!*\n\nTu pedido de NaturalVer''s ha sido registrado con éxito. Esperamos que disfrutes de nuestros productos naturales. 🌿\n\nSi tienes alguna duda, estamos a tu orden.',
 'greeting'
WHERE NOT EXISTS (SELECT 1 FROM templates WHERE title = 'Agradecimiento de Compra');

-- Default company config
INSERT INTO company_config (name, rif, address, phone, email)
SELECT 'NaturalVer''s', '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM company_config);
