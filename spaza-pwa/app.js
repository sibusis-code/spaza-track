import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getCurrentUser as apiGetCurrentUser,
  getProducts,
  createProduct,
  updateProductQuantity,
  deleteProduct,
  recordSale,
  getSales,
  getStats,
} from './api-client.js';

const byId = (id) => document.getElementById(id);
const fmtRand = (n) => (Number(n) || 0).toFixed(2);
const todayKey = () => new Date().toISOString().slice(0, 10);

let productFilterTerm = '';
let productFilterTimer = null;
let saleFilterTerm = '';
let saleFilterTimer = null;
let currentUser = null;

// ----- Auth UI -----
function setAuthVisible(showAuth) {
  byId('auth').classList.toggle('hidden', !showAuth);
  byId('app').classList.toggle('hidden', showAuth);
}

function showAuthError(msg) {
  const el = byId('auth-error');
  if (el) el.textContent = msg || '';
}

function toggleRoleFields(role) {
  const shopNameRow = byId('shop-name-row');
  const shopIdRow = byId('shop-id-row');
  if (!shopNameRow || !shopIdRow) return;
  const isAdmin = role === 'admin';
  shopNameRow.classList.toggle('hidden', !isAdmin);
  shopIdRow.classList.toggle('hidden', isAdmin);
}

function initAuthForms() {
  const loginForm = byId('login-form');
  const registerForm = byId('register-form');
  const registerRole = byId('register-role');

  toggleRoleFields(registerRole.value);
  registerRole.addEventListener('change', () => toggleRoleFields(registerRole.value));

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    showAuthError('');
    const username = byId('login-username').value.trim();
    const password = byId('login-password').value.trim();
    try {
      const res = await apiLogin(username, password);
      currentUser = res.user;
      onAuthenticated();
    } catch (err) {
      showAuthError(err.message || 'Login failed');
    }
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    showAuthError('');
    const username = byId('reg-username').value.trim();
    const email = byId('reg-email').value.trim();
    const fullName = byId('reg-fullname').value.trim();
    const password = byId('reg-password').value.trim();
    const role = byId('register-role').value;
    const shopName = byId('reg-shop-name').value.trim();
    const shopJoin = byId('reg-shop-id').value.trim();
    const joinAsNumber = Number(shopJoin);
    const shopId = shopJoin !== '' && Number.isFinite(joinAsNumber) ? joinAsNumber : undefined;
    const shopNameForEmployee = !Number.isFinite(joinAsNumber) && shopJoin ? shopJoin : undefined;
    try {
      const res = await apiRegister(
        username,
        email,
        fullName,
        password,
        role,
        role === 'admin' ? shopName || undefined : shopNameForEmployee,
        role !== 'admin' ? shopId : undefined
      );
      currentUser = res.user;
      onAuthenticated();
    } catch (err) {
      showAuthError(err.message || 'Registration failed');
    }
  });

  document.querySelectorAll('[data-auth-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.authTab;
      document.querySelectorAll('[data-auth-panel]').forEach((panel) => {
        panel.classList.toggle('hidden', panel.dataset.authPanel !== target);
      });
      document.querySelectorAll('[data-auth-tab]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

function onAuthenticated() {
  setAuthVisible(false);
  configureUIForRole();
  initApp();
}

function configureUIForRole() {
  const isAdmin = currentUser?.role === 'admin';
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    const tab = btn.dataset.tab;
    const allowed = isAdmin || tab === 'sales';
    btn.classList.toggle('hidden', !allowed);
  });
  document.querySelectorAll('.tab').forEach((s) => s.classList.add('hidden'));
  if (isAdmin) {
    byId('tab-products').classList.remove('hidden');
  } else {
    byId('tab-sales').classList.remove('hidden');
  }
  const profitHeader = byId('profit-header');
  if (profitHeader) profitHeader.classList.toggle('hidden', !isAdmin);
  const addProductCard = byId('add-product-form');
  if (addProductCard) addProductCard.classList.toggle('hidden', !isAdmin);
}

// ----- Tabs -----
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      const isAdmin = currentUser?.role === 'admin';
      if (!isAdmin && tab !== 'sales') return;
      document.querySelectorAll('.tab').forEach((s) => s.classList.add('hidden'));
      byId(`tab-${tab}`).classList.remove('hidden');
      if (tab === 'products') renderProducts();
      if (tab === 'sales') {
        renderProductsForSale();
        renderTodaySales();
      }
      if (tab === 'summary') {
        renderSummary();
      }
    });
  });
}

// ----- Products UI -----
async function renderProducts() {
  const products = await getProducts();
  const tbody = byId('products-tbody');
  tbody.innerHTML = '';
  const term = productFilterTerm.trim().toLowerCase();
  const sorted = products
    .filter((p) => !term || p.name.toLowerCase().includes(term))
    .sort((a, b) => a.name.localeCompare(b.name));
  sorted.forEach((p) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.name}</td>
      <td>R${fmtRand(p.cost_price)}</td>
      <td>R${fmtRand(p.selling_price)}</td>
      <td>${p.quantity}</td>
      <td>
        <div class="inline-actions">
          <input class="restock-input" type="number" min="1" max="999" value="1" data-restock-input="${p.id}">
          <button class="secondary" data-restock="${p.id}">+ Add</button>
          <button class="secondary" data-del="${p.id}">Delete</button>
        </div>
      </td>`;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('[data-restock]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const productId = Number(btn.getAttribute('data-restock'));
      const input = tbody.querySelector(`[data-restock-input="${productId}"]`);
      const addQty = Number(input.value);
      if (addQty <= 0) return;
      const product = products.find((p) => p.id === productId);
      if (product) {
        await updateProductQuantity(product.id, product.quantity + addQty);
        renderProducts();
        renderProductsForSale();
      }
    });
  });

  tbody.querySelectorAll('[data-del]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await deleteProduct(btn.getAttribute('data-del'));
      renderProducts();
      renderProductsForSale();
    });
  });
}

async function renderProductsForSale() {
  const products = await getProducts();
  const sel = byId('sale-product');
  const prev = sel.value;
  sel.innerHTML = '';
  const term = saleFilterTerm.trim().toLowerCase();
  const sorted = [...products]
    .filter((p) => !term || p.name.toLowerCase().includes(term))
    .sort((a, b) => a.name.localeCompare(b.name));
  sorted.forEach((p) => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `${p.name} (qty ${p.quantity})`;
    sel.appendChild(opt);
  });
  if (prev && sel.querySelector(`option[value="${prev}"]`)) {
    sel.value = prev;
  }
}

function initProductForm() {
  const form = byId('add-product-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = byId('p-name').value;
    const cost_price = byId('p-cost').value;
    const selling_price = byId('p-sell').value;
    const quantity = byId('p-qty').value;
    if (!name || !cost_price || !selling_price || quantity === '') return;
    await createProduct(name, Number(cost_price), Number(selling_price), Number(quantity));
    form.reset();
    renderProducts();
    renderProductsForSale();
  });
}

function initProductFilter() {
  const input = byId('product-filter');
  if (!input) return;
  input.addEventListener('input', () => {
    const value = input.value;
    if (productFilterTimer) clearTimeout(productFilterTimer);
    productFilterTimer = setTimeout(() => {
      productFilterTerm = value;
      renderProducts();
      renderProductsForSale();
    }, 120);
  });
}

function initSaleFilter() {
  const input = byId('sale-filter');
  if (!input) return;
  input.addEventListener('input', () => {
    const value = input.value;
    if (saleFilterTimer) clearTimeout(saleFilterTimer);
    saleFilterTimer = setTimeout(() => {
      saleFilterTerm = value;
      renderProductsForSale();
    }, 120);
  });
}

// ----- Sales UI -----
function initSalesForm() {
  byId('sale-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const productId = byId('sale-product').value;
    const qty = byId('sale-qty').value;
    try {
      await recordSale(productId, Number(qty));
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
  const sales = await getSales(todayKey());
  const tbody = byId('sales-tbody');
  const isAdmin = currentUser?.role === 'admin';
  tbody.innerHTML = '';
  sales.forEach((s) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${s.employee_name || 'Unknown'}</td>
      <td>${s.product_name}</td>
      <td>${s.quantity_sold}</td>
      <td>R${fmtRand(s.total_price)}</td>
      <td class="${isAdmin ? '' : 'hidden'}">R${fmtRand(s.profit)}</td>`;
    tbody.appendChild(tr);
  });
}

// ----- Summary -----
async function renderSummary() {
  const todaySales = await getSales(todayKey());
  const todayProfit = todaySales.reduce((sum, s) => sum + (s.profit || 0), 0);
  byId('today-profit').textContent = `Today’s Profit: R${fmtRand(todayProfit)}`;
  const stats = await getStats();
  const alerts = (stats.low_stock_items || []).map((i) => `${i.name} (${i.quantity})`);
  byId('stock-alerts').textContent = alerts.length ? `Low stock: ${alerts.join(', ')}` : '';
}

// ----- Bootstrap -----
let appInitialized = false;

function initApp() {
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
  initProductFilter();
  initSaleFilter();
  initSalesForm();
  renderProducts();
  renderProductsForSale();
  renderTodaySales();
  renderSummary();
  byId('lock-btn').onclick = () => {
    apiLogout();
    currentUser = null;
    setAuthVisible(true);
  };
}

async function bootstrap() {
  initAuthForms();
  try {
    const me = await apiGetCurrentUser();
    if (me) {
      currentUser = me;
      onAuthenticated();
      return;
    }
  } catch {
    // ignore, show auth
  }
  setAuthVisible(true);
}

bootstrap();

git add DEPLOY_NOW.md api-client.js app.js backend/create_admin.py backend/main.py backend/models.py backend/schemas.py index.html 404.html requirements.txt
git commit -m "Deploy: multi-tenant auth, API URL, deps, docs"
git push origin master
