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
