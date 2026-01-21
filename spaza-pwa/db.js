// IndexedDB wrapper for products and sales
const DB_NAME = 'spaza-db';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = req.result;
      if (!db.objectStoreNames.contains('products')) {
        const store = db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
        store.createIndex('name', 'name', { unique: false });
      }
      if (!db.objectStoreNames.contains('sales')) {
        const store = db.createObjectStore('sales', { keyPath: 'id', autoIncrement: true });
        store.createIndex('product_id', 'product_id', { unique: false });
        store.createIndex('date', 'date', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(storeName, mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(storeName, mode);
    const store = t.objectStore(storeName);
    const result = fn(store);
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
  });
}

// Products CRUD
export async function addProduct(product) {
  product.name = product.name.trim();
  product.cost_price = Number(product.cost_price);
  product.selling_price = Number(product.selling_price);
  product.quantity = Number(product.quantity);
  return tx('products', 'readwrite', (store) => store.add(product));
}

export async function listProducts() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction('products', 'readonly');
    const store = t.objectStore('products');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteProduct(id) {
  return tx('products', 'readwrite', (store) => store.delete(Number(id)));
}

export async function setProductQuantity(id, qty) {
  const db = await openDB();
  const product = await new Promise((resolve, reject) => {
    const t = db.transaction('products', 'readonly');
    const store = t.objectStore('products');
    const req = store.get(Number(id));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  if (!product) return;
  product.quantity = Number(qty);
  return tx('products', 'readwrite', (store) => store.put(product));
}

// Sales operations
export async function recordSale(productId, qty, employeeName = 'Unknown') {
  qty = Number(qty);
  const products = await listProducts();
  const product = products.find(p => p.id === Number(productId));
  if (!product) throw new Error('Product not found');
  if (qty <= 0) throw new Error('Invalid quantity');
  if (product.quantity < qty) throw new Error('Not enough stock');

  const total_price = product.selling_price * qty;
  const profit = (product.selling_price - product.cost_price) * qty;
  const date = new Date();
  const dateKey = date.toISOString().slice(0,10); // YYYY-MM-DD

  await tx('sales', 'readwrite', (store) => store.add({
    product_id: product.id,
    name: product.name,
    quantity_sold: qty,
    total_price,
    profit,
    date: dateKey,
    employee_name: employeeName,
  }));

  // reduce stock
  await setProductQuantity(product.id, product.quantity - qty);
  return { total_price, profit, name: product.name, qty, employee_name: employeeName };
}

export async function listSalesForDate(dateKey) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction('sales', 'readonly');
    const store = t.objectStore('sales');
    const idx = store.index('date');
    const req = idx.getAll(dateKey);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function getDailyProfit(dateKey) {
  const sales = await listSalesForDate(dateKey);
  return sales.reduce((sum, s) => sum + Number(s.profit || 0), 0);
}

export async function lowStockAlerts(threshold = 3) {
  const products = await listProducts();
  return products.filter(p => Number(p.quantity) <= threshold).map(p => `${p.name} low: ${p.quantity}`);
}

// ===== DATABASE UTILITIES FOR TESTING & DATA FLOW =====

// Export entire database to JSON
export async function exportDatabase() {
  const products = await listProducts();
  const db = await openDB();
  const sales = await new Promise((resolve, reject) => {
    const t = db.transaction('sales', 'readonly');
    const store = t.objectStore('sales');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
  
  return {
    exported_at: new Date().toISOString(),
    db_name: DB_NAME,
    db_version: DB_VERSION,
    products,
    sales,
    stats: {
      total_products: products.length,
      total_sales: sales.length,
      total_value: products.reduce((sum, p) => sum + (p.quantity * p.cost_price), 0),
      total_profit: sales.reduce((sum, s) => sum + (s.profit || 0), 0)
    }
  };
}

// Import database from JSON
export async function importDatabase(data, options = { merge: false }) {
  if (!data || !data.products || !data.sales) {
    throw new Error('Invalid import data format');
  }
  
  const db = await openDB();
  
  if (!options.merge) {
    // Clear existing data
    await tx('products', 'readwrite', (store) => store.clear());
    await tx('sales', 'readwrite', (store) => store.clear());
  }
  
  // Import products
  for (const product of data.products) {
    await tx('products', 'readwrite', (store) => {
      const { id, ...productData } = product; // Remove id to let auto-increment work
      return store.add(productData);
    });
  }
  
  // Import sales
  for (const sale of data.sales) {
    await tx('sales', 'readwrite', (store) => {
      const { id, ...saleData } = sale;
      return store.add(saleData);
    });
  }
  
  return {
    imported_products: data.products.length,
    imported_sales: data.sales.length,
    timestamp: new Date().toISOString()
  };
}

// Clear all data
export async function clearDatabase() {
  await tx('products', 'readwrite', (store) => store.clear());
  await tx('sales', 'readwrite', (store) => store.clear());
  return { status: 'Database cleared', timestamp: new Date().toISOString() };
}

// Get database statistics
export async function getDatabaseStats() {
  const products = await listProducts();
  const db = await openDB();
  const sales = await new Promise((resolve, reject) => {
    const t = db.transaction('sales', 'readonly');
    const store = t.objectStore('sales');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
  
  const totalStock = products.reduce((sum, p) => sum + Number(p.quantity), 0);
  const totalValue = products.reduce((sum, p) => sum + (Number(p.quantity) * Number(p.cost_price)), 0);
  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_price || 0), 0);
  const totalProfit = sales.reduce((sum, s) => sum + Number(s.profit || 0), 0);
  const lowStock = products.filter(p => Number(p.quantity) <= 3);
  
  // Sales by date
  const salesByDate = sales.reduce((acc, sale) => {
    const date = sale.date || 'unknown';
    if (!acc[date]) acc[date] = [];
    acc[date].push(sale);
    return acc;
  }, {});
  
  return {
    products: {
      count: products.length,
      total_stock: totalStock,
      total_value: fmtRand(totalValue),
      low_stock_count: lowStock.length,
      low_stock_items: lowStock.map(p => ({ name: p.name, quantity: p.quantity }))
    },
    sales: {
      count: sales.length,
      total_revenue: fmtRand(totalRevenue),
      total_profit: fmtRand(totalProfit),
      dates: Object.keys(salesByDate).sort(),
      by_date: Object.entries(salesByDate).map(([date, items]) => ({
        date,
        count: items.length,
        revenue: fmtRand(items.reduce((sum, s) => sum + Number(s.total_price || 0), 0)),
        profit: fmtRand(items.reduce((sum, s) => sum + Number(s.profit || 0), 0))
      }))
    },
    timestamp: new Date().toISOString()
  };
}

// Seed database with sample data for testing
export async function seedDatabase() {
  const sampleProducts = [
    { name: 'Coca Cola 500ml', cost_price: 8.50, selling_price: 12.00, quantity: 24 },
    { name: 'White Bread Loaf', cost_price: 10.00, selling_price: 14.50, quantity: 15 },
    { name: 'Milk 1L', cost_price: 16.00, selling_price: 20.00, quantity: 12 },
    { name: 'Sugar 2.5kg', cost_price: 35.00, selling_price: 42.00, quantity: 8 },
    { name: 'Cooking Oil 750ml', cost_price: 22.00, selling_price: 28.00, quantity: 10 },
    { name: 'Maize Meal 5kg', cost_price: 48.00, selling_price: 58.00, quantity: 20 },
    { name: 'Eggs (6 pack)', cost_price: 18.00, selling_price: 23.00, quantity: 30 },
    { name: 'Washing Powder 1kg', cost_price: 28.00, selling_price: 35.00, quantity: 5 },
    { name: 'Instant Coffee 200g', cost_price: 45.00, selling_price: 55.00, quantity: 7 },
    { name: 'Tomato Sauce 700ml', cost_price: 15.00, selling_price: 19.50, quantity: 2 }
  ];
  
  const addedProducts = [];
  for (const product of sampleProducts) {
    const result = await addProduct(product);
    addedProducts.push(result);
  }
  
  return {
    status: 'Database seeded',
    products_added: addedProducts.length,
    timestamp: new Date().toISOString()
  };
}

// Helper function for formatting currency
function fmtRand(n) {
  return (Number(n) || 0).toFixed(2);
}

// Get all sales (not just for a date)
export async function listAllSales() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction('sales', 'readonly');
    const store = t.objectStore('sales');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

// Log changes for debugging
export async function logDatabaseChange(action, details) {
  console.log(`[DB] ${action}:`, details);
  // You can extend this to store in a separate 'logs' object store if needed
}
