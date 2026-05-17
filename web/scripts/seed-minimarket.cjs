const https = require("https");

const products = [
  ["Agua Mineral 1.5L", "Bebidas", 0.8, 50, 10],
  ["Coca-Cola 2L", "Bebidas", 2.0, 30, 10],
  ["Coca-Cola Personal 355ml", "Bebidas", 0.8, 60, 20],
  ["Pepsi 2L", "Bebidas", 1.8, 30, 10],
  ["Malt\u00edn Polar 2L", "Bebidas", 2.5, 20, 5],
  ["Jugo Natural de Naranja 1L", "Bebidas", 1.5, 25, 10],
  ["Agua Saborizada 1.5L", "Bebidas", 1.2, 20, 10],
  ["Arroz 1kg", "Alimentos", 1.2, 40, 10],
  ["Pasta Larga 500g", "Alimentos", 0.8, 40, 10],
  ["Aceite Vegetal 1L", "Alimentos", 2.5, 20, 5],
  ["Az\u00facar 1kg", "Alimentos", 1.0, 30, 10],
  ["Harina de Ma\u00edz 1kg", "Alimentos", 1.5, 25, 10],
  ["Sal 500g", "Alimentos", 0.5, 30, 10],
  ["Caf\u00e9 Molido 250g", "Alimentos", 2.0, 20, 5],
  ["Lentejas 500g", "Alimentos", 1.2, 20, 5],
  ["At\u00fan en Lata", "Alimentos", 1.5, 40, 10],
  ["Sardinas en Lata", "Alimentos", 1.0, 30, 10],
  ["Leche Completa 1L", "L\u00e1cteos", 1.8, 30, 10],
  ["Queso Blanco 500g", "L\u00e1cteos", 3.0, 15, 5],
  ["Mantequilla 250g", "L\u00e1cteos", 2.0, 15, 5],
  ["Yogurt Natural 1L", "L\u00e1cteos", 2.5, 15, 5],
  ["Huevos Blanco 12u", "L\u00e1cteos", 2.5, 25, 10],
  ["Pan de Molde Blanco", "Panader\u00eda", 1.8, 15, 5],
  ["Pan Canilla (unidad)", "Panader\u00eda", 0.25, 100, 20],
  ["Galletas de Soda 200g", "Panader\u00eda", 0.8, 30, 10],
  ["Galletas Dulces 150g", "Panader\u00eda", 1.0, 25, 10],
  ["Jab\u00f3n de Ba\u00f1o", "Aseo Personal", 0.8, 40, 10],
  ["Shampoo 400ml", "Aseo Personal", 2.5, 20, 5],
  ["Pasta Dental", "Aseo Personal", 1.5, 25, 10],
  ["Desodorante", "Aseo Personal", 2.0, 20, 5],
  ["Papel Higi\u00e9nico 4u", "Aseo Personal", 1.5, 40, 10],
  ["Cepillo de Dientes", "Aseo Personal", 1.0, 20, 10],
  ["Papas Fritas 70g", "Botanas", 0.8, 50, 20],
  ["Chicles (unidad)", "Botanas", 0.1, 200, 50],
  ["Chocolate en Barra", "Botanas", 1.0, 30, 10],
  ["Man\u00ed Salado 100g", "Botanas", 0.6, 30, 10],
  ["Caramelos (unidad)", "Botanas", 0.05, 500, 100],
  ["Cloro 1L", "Aseo Hogar", 1.0, 20, 5],
  ["Detergente 500g", "Aseo Hogar", 1.8, 20, 5],
  ["Lavavajillas 500ml", "Aseo Hogar", 1.5, 15, 5],
  ["Desinfectante 1L", "Aseo Hogar", 1.2, 15, 5],
  ["Esponja de Cocina", "Aseo Hogar", 0.3, 30, 10],
  ["Jam\u00f3n de Pollo 250g", "Embutidos", 2.5, 15, 5],
  ["Salchichas 6u", "Embutidos", 2.0, 15, 5],
  ["Mortadela 250g", "Embutidos", 1.8, 15, 5],
];

const BIZ = "ee5c7651-189e-4cbb-a526-35a4b7c28743";

async function run() {
  let count = 0;
  for (const [name, cat, price, stock, threshold] of products) {
    const pres = JSON.stringify([{ id: "un", name: "Unidad", priceUSD: price, priceBs: 0, stock, lowStockThreshold: threshold }]);
    const sql = `INSERT INTO products (business_id, name, category, presentations) SELECT '${BIZ}', '${name}', '${cat}', '${pres}' WHERE NOT EXISTS (SELECT 1 FROM products WHERE business_id = '${BIZ}' AND name = '${name}');`;
    const success = await query(sql);
    if (success) count++;
  }
  console.log(`Inserted ${count}/${products.length} products`);
}

function query(sql) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ query: sql });
    const req = https.request(
      {
        hostname: "api.supabase.com",
        path: "/v1/projects/trnbgsixswqniiuusgdh/database/query",
        method: "POST",
        headers: {
          apikey: process.env.SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
          "Content-Type": "application/json",
        },
      },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve(res.statusCode === 200));
      }
    );
    req.on("error", () => resolve(false));
    req.write(data);
    req.end();
  });
}

run();
