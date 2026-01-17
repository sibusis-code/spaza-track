import { addProduct, listProducts, deleteProduct, setProductQuantity, recordSale, listSalesForDate, getDailyProfit, lowStockAlerts } from './db.js';

const byId = (id) => document.getElementById(id);
const fmtRand = (n) => (Number(n)||0).toFixed(2);
const todayKey = () => new Date().toISOString().slice(0,10);

// Auth / PIN
let currentRole = 'guest';
let currentEmployeeName = '';

function getEmployeePins() {
  try { 
    const data = JSON.parse(localStorage.getItem('employeePins') || '[]');
    // Migrate old string-only format to {pin, name} format
    return data.map(item => typeof item === 'string' ? {pin: item, name: item} : item);
  } catch { return []; }
}
function saveEmployeePins(pins) { localStorage.setItem('employeePins', JSON.stringify(pins)); }

function getEmployeePinStrings() {
  return getEmployeePins().map(e => e.pin);
}

function getEmployeeNameByPin(pin) {
  const emps = getEmployeePins();
  const emp = emps.find(e => e.pin === pin);
  return emp ? emp.name : 'Unknown';
}

function configureUIForRole() {
  const isAdmin = currentRole === 'admin';
  // Nav buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    const tab = btn.dataset.tab;
    const allowed = isAdmin || tab === 'sales';
    btn.classList.toggle('hidden', !allowed);
  });
  // Tabs visibility defaults
  document.querySelectorAll('.tab').forEach(s => s.classList.add('hidden'));
  if (isAdmin) {
    byId('tab-products').classList.remove('hidden');
  } else {
    byId('tab-sales').classList.remove('hidden');
  }
  // Admin-only sections
  const usersCard = document.getElementById('users-card');
  if (usersCard) usersCard.classList.toggle('hidden', !isAdmin);
  // Hide profit from employees
  const profitHeader = document.getElementById('profit-header');
  if (profitHeader) profitHeader.classList.toggle('hidden', !isAdmin);
  // Ensure modal is hidden on init
  const modal = byId('restock-modal');
  if (modal) modal.classList.add('hidden');
}

function initAuth() {
  const adminPin = localStorage.getItem('adminPin');
  const auth = byId('auth');
  const app = byId('app');
  const setup = byId('pin-setup');
  const unlock = byId('pin-unlock');
  const err = byId('pin-error');

  if (!adminPin) {
    setup.classList.remove('hidden');
    unlock.classList.add('hidden');
  } else {
    setup.classList.add('hidden');
    unlock.classList.remove('hidden');
  }

  byId('set-pin-btn').onclick = () => {
    const pin = byId('new-pin').value.trim();
    if (!pin || pin.length < 4 || pin.length > 6 || /\D/.test(pin)) {
      err.textContent = 'PIN must be 4–6 digits';
      return;
    }
    localStorage.setItem('adminPin', pin);
    setup.classList.add('hidden');
    unlock.classList.remove('hidden');
    err.textContent = '';
  };

  let pinAttempts = 0;
  byId('unlock-btn').onclick = () => {
    pinAttempts++;
    if (pinAttempts > 5) {
      err.textContent = 'Too many attempts. Please try again later.';
      byId('unlock-btn').disabled = true;
      setTimeout(() => { byId('unlock-btn').disabled = false; pinAttempts = 0; }, 30000); // 30s lockout
      return;
    }
    const pin = byId('pin').value.trim();
    const adminPinNow = localStorage.getItem('adminPin');
    const empPinStrings = getEmployeePinStrings();
    if (pin === adminPinNow) {
      currentRole = 'admin';
      currentEmployeeName = 'Admin';
      auth.classList.add('hidden');
      app.classList.remove('hidden');
      initApp();
      configureUIForRole();
      pinAttempts = 0;
    } else if (empPinStrings.includes(pin)) {
      currentRole = 'employee';
      currentEmployeeName = getEmployeeNameByPin(pin);
      auth.classList.add('hidden');
      app.classList.remove('hidden');
      initApp();
      configureUIForRole();
      pinAttempts = 0;
    } else {
      err.textContent = `Incorrect PIN (attempt ${pinAttempts}/5)`;
    }
  };

  byId('lock-btn').onclick = () => {
    app.classList.add('hidden');
    auth.classList.remove('hidden');
    byId('pin').value = '';
    err.textContent = '';
    currentRole = 'guest';
    currentEmployeeName = '';
  };
}

// Tabs
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      const isAdmin = currentRole === 'admin';
      if (!isAdmin && tab !== 'sales') return; // guard
      document.querySelectorAll('.tab').forEach(s => s.classList.add('hidden'));
      byId(`tab-${tab}`).classList.remove('hidden');
      if (tab === 'products') renderProducts();
      if (tab === 'sales') { renderProductsForSale(); renderTodaySales(); }
      if (tab === 'summary') { renderSummary(); renderEmployeeList(); }
    });
  });
}

// Products UI
let restockProductId = null;

async function renderProducts() {
  const products = await listProducts();
  const tbody = byId('products-tbody');
  tbody.innerHTML = '';
  products.forEach(p => {
    const tr = document.createElement('tr');
    const nameCell = document.createElement('td');
    nameCell.textContent = p.name; // Prevent XSS
    const costCell = document.createElement('td');
    costCell.textContent = `R${fmtRand(p.cost_price)}`;
    const sellCell = document.createElement('td');
    sellCell.textContent = `R${fmtRand(p.selling_price)}`;
    const qtyCell = document.createElement('td');
    qtyCell.textContent = p.quantity;
    const actCell = document.createElement('td');
    actCell.innerHTML = `<button class="secondary" data-restock="${p.id}" style="margin-right: 4px;">Restock</button><button class="secondary" data-del="${p.id}">Delete</button>`;
    tr.appendChild(nameCell);
    tr.appendChild(costCell);
    tr.appendChild(sellCell);
    tr.appendChild(qtyCell);
    tr.appendChild(actCell);
    tbody.appendChild(tr);
  });
  // Restock handlers
  tbody.querySelectorAll('[data-restock]').forEach(btn => {
    btn.addEventListener('click', () => {
      restockProductId = Number(btn.getAttribute('data-restock'));
      const product = products.find(p => p.id === restockProductId);
      byId('restock-title').textContent = `Restock ${product.name}`;
      byId('restock-qty').value = '1';
      byId('restock-modal').classList.remove('hidden');
    });
  });
  // Delete handlers
  tbody.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', async () => {
      await deleteProduct(btn.getAttribute('data-del'));
      renderProducts();
      renderProductsForSale();
    });
  });
}

async function renderProductsForSale() {
  const products = await listProducts();
  const sel = byId('sale-product');
  sel.innerHTML = '';
  products.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `${p.name} (qty ${p.quantity})`;
    sel.appendChild(opt);
  });
}

function initProductForm() {
  byId('add-product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = byId('p-name').value;
    const cost_price = byId('p-cost').value;
    const selling_price = byId('p-sell').value;
    const quantity = byId('p-qty').value;
    if (!name || !cost_price || !selling_price || quantity === '') return;
    await addProduct({ name, cost_price, selling_price, quantity });
    e.target.reset();
    renderProducts();
    renderProductsForSale();
  });
}

function initRestockModal() {
  const modal = byId('restock-modal');
  if (!modal) return;
  
  byId('restock-confirm').onclick = async () => {
    const qty = Number(byId('restock-qty').value);
    if (qty <= 0) return;
    const products = await listProducts();
    const product = products.find(p => p.id === restockProductId);
    if (product) {
      await setProductQuantity(product.id, product.quantity + qty);
      modal.classList.add('hidden');
      renderProducts();
      renderProductsForSale();
    }
  };

  byId('restock-cancel').onclick = () => {
    modal.classList.add('hidden');
  };
}

// Sales UI
function initSalesForm() {
  byId('sale-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const productId = byId('sale-product').value;
    const qty = byId('sale-qty').value;
    try {
      const sale = await recordSale(productId, qty, currentEmployeeName);
      byId('sale-qty').value = '';
      renderProductsForSale();
      renderTodaySales();
      renderSummary();
    } catch (err) {
      alert(err.message);
    }
  });
}

async function renderTodaySales() {
  const sales = await listSalesForDate(todayKey());
  const tbody = byId('sales-tbody');
  const isAdmin = currentRole === 'admin';
  tbody.innerHTML = '';
  sales.forEach(s => {
    const tr = document.createElement('tr');
    const sellerCell = document.createElement('td');
    sellerCell.textContent = s.employee_name || 'Unknown'; // Prevent XSS
    const itemCell = document.createElement('td');
    itemCell.textContent = s.name; // Prevent XSS
    const qtyCell = document.createElement('td');
    qtyCell.textContent = s.quantity_sold;
    const totalCell = document.createElement('td');
    totalCell.textContent = `R${fmtRand(s.total_price)}`;
    const profitCell = document.createElement('td');
    if (!isAdmin) profitCell.style.display = 'none';
    profitCell.textContent = `R${fmtRand(s.profit)}`;
    tr.appendChild(sellerCell);
    tr.appendChild(itemCell);
    tr.appendChild(qtyCell);
    tr.appendChild(totalCell);
    tr.appendChild(profitCell);
    tbody.appendChild(tr);
  });
}

// Summary
async function renderSummary() {
  const profit = await getDailyProfit(todayKey());
  byId('today-profit').textContent = `Today’s Profit: R${fmtRand(profit)}`;
  const alerts = await lowStockAlerts();
  byId('stock-alerts').textContent = alerts.length ? (`Low stock: ${alerts.join(', ')}`) : '';
}

function renderEmployeeList() {
  const list = byId('emp-list');
  if (!list) return;
  const pins = getEmployeePins();
  list.innerHTML = '';
  pins.forEach((emp, idx) => {
    const li = document.createElement('li');
    const empObj = typeof emp === 'string' ? {pin: emp, name: emp} : emp;
    const nameSpan = document.createElement('span');
    nameSpan.textContent = `${empObj.name} (PIN: ${empObj.pin})`; // Prevent XSS
    const delBtn = document.createElement('button');
    delBtn.className = 'del-emp';
    delBtn.setAttribute('data-idx', idx);
    delBtn.style.cssText = 'font-size:12px; padding: 4px 8px; margin-left: 8px;';
    delBtn.textContent = 'Remove';
    li.appendChild(nameSpan);
    li.appendChild(delBtn);
    list.appendChild(li);
  });
  document.querySelectorAll('.del-emp').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-idx'));
      pins.splice(idx, 1);
      saveEmployeePins(pins);
      renderEmployeeList();
    });
  });
}

function initSummary() {
  byId('refresh-summary').onclick = () => { renderSummary(); renderEmployeeList(); };
  const addBtn = byId('add-emp-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const name = byId('emp-name').value.trim();
      const pin = byId('emp-pin').value.trim();
      const err = byId('users-msg');
      if (!name) {
        err.textContent = 'Employee name is required';
        return;
      }
      if (!pin || pin.length < 4 || pin.length > 6 || /\D/.test(pin)) {
        err.textContent = 'Employee PIN must be 4–6 digits';
        return;
      }
      const adminPinNow = localStorage.getItem('adminPin');
      if (pin === adminPinNow) {
        err.textContent = 'Employee PIN cannot be the same as admin PIN';
        return;
      }
      const pins = getEmployeePins();
      if (!pins.find(e => e.pin === pin)) {
        pins.push({pin, name});
        saveEmployeePins(pins);
        byId('emp-name').value = '';
        byId('emp-pin').value = '';
        err.textContent = 'Employee added';
        renderEmployeeList();
      } else {
        err.textContent = 'PIN already exists';
      }
    });
  }
}

// Bootstrap
let appInitialized = false;

function initApp() {
  // If already initialized, just refresh views to avoid duplicate bindings
  if (appInitialized) {
    renderProducts();
    renderProductsForSale();
    renderTodaySales();
    renderSummary();
    return;
  }
  appInitialized = true;
  initTabs();
  initProductForm();
  initRestockModal();
  initSalesForm();
  initSummary();
  renderProducts();
  renderProductsForSale();
  renderTodaySales();
  renderSummary();
}

initAuth();
