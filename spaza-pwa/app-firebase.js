// Firebase App.js - Complete rewrite for Firebase
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { auth } from './firebase-config.js';
import firebaseService from './firebase-service.js';

class SpazaApp {
  constructor() {
    this.currentUser = null;
    this.currentShop = null;
    this.products = [];
    this.sales = [];
    this.unsubscribers = [];
    
    this.init();
  }

  async init() {
    // Show loading screen
    this.showScreen('loading-screen');
    
    // Wait for auth state
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.currentUser = user;
        firebaseService.setCurrentUser(user, this.currentShop);
        this.handleUserLoggedIn();
      } else {
        this.currentUser = null;
        this.handleUserLoggedOut();
      }
    });
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Auth buttons
    document.getElementById('login-btn')?.addEventListener('click', () => this.login());
    document.getElementById('logout-btn')?.addEventListener('click', () => this.logout());
    
    // Shop management
    document.getElementById('create-shop-btn')?.addEventListener('click', () => this.showCreateShopForm());
    document.getElementById('join-shop-btn')?.addEventListener('click', () => this.showJoinShopForm());
    document.getElementById('create-shop-cancel')?.addEventListener('click', () => this.hideShopForms());
    document.getElementById('join-shop-cancel')?.addEventListener('click', () => this.hideShopForms());
    document.getElementById('create-shop-submit')?.addEventListener('click', () => this.createShop());
    document.getElementById('join-shop-submit')?.addEventListener('click', () => this.joinShop());

    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });

    // Products
    document.getElementById('add-product-btn')?.addEventListener('click', () => this.showProductModal());
    document.getElementById('product-form')?.addEventListener('submit', (e) => this.handleProductSubmit(e));

    // Sales
    document.getElementById('sale-form')?.addEventListener('submit', (e) => this.handleSaleSubmit(e));
    document.getElementById('sales-date-filter')?.addEventListener('change', (e) => this.filterSales(e.target.value));

    // Modal close buttons
    document.querySelectorAll('.modal .close').forEach(btn => {
      btn.addEventListener('click', (e) => this.closeModal(e.target.closest('.modal').id));
    });
  }

  showScreen(screenId) {
    const screens = ['loading-screen', 'auth-required', 'shop-selection', 'main-app'];
    screens.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.style.display = id === screenId ? 'flex' : 'none';
      }
    });
  }

  async login() {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle the rest
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed: ' + error.message);
    }
  }

  async logout() {
    try {
      // Clean up listeners
      this.unsubscribers.forEach(unsub => unsub());
      this.unsubscribers = [];
      
      await signOut(auth);
      this.currentUser = null;
      this.currentShop = null;
      // onAuthStateChanged will handle the rest
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Logout failed: ' + error.message);
    }
  }

  handleUserLoggedIn() {
    // Check if user has shops
    this.loadUserShops();
  }

  handleUserLoggedOut() {
    this.showScreen('auth-required');
  }

  async loadUserShops() {
    try {
      const shops = await firebaseService.getShops();
      
      if (shops.length === 0) {
        this.showScreen('shop-selection');
      } else if (shops.length === 1) {
        // Auto-select single shop
        await this.selectShop(shops[0]);
      } else {
        // Show shop selection
        this.showShopSelection(shops);
      }
    } catch (error) {
      console.error('Failed to load shops:', error);
      this.showScreen('shop-selection');
    }
  }

  showShopSelection(shops) {
    const shopList = document.getElementById('shop-list');
    shopList.innerHTML = shops.map(shop => `
      <div class="shop-item" onclick="app.selectShop(${JSON.stringify(shop).replace(/"/g, '&quot;')})">
        <h3>${shop.name}</h3>
        <p>Shop ID: ${shop.id}</p>
      </div>
    `).join('');
    
    this.showScreen('shop-selection');
  }

  async selectShop(shop) {
    this.currentShop = shop;
    firebaseService.setCurrentUser(this.currentUser, shop);
    
    // Update UI
    document.getElementById('shop-name').textContent = shop.name;
    document.getElementById('user-name').textContent = this.currentUser.displayName || this.currentUser.email;
    
    // Load data and setup real-time listeners
    await this.setupRealTimeListeners();
    await this.loadAllData();
    
    this.showScreen('main-app');
  }

  setupRealTimeListeners() {
    // Products listener
    const productsUnsub = firebaseService.onProductsChange((products) => {
      this.products = products;
      this.renderProducts();
      this.updateDashboard();
      this.updateSaleProductDropdown();
    });
    this.unsubscribers.push(productsUnsub);

    // Sales listener
    const salesUnsub = firebaseService.onSalesChange((sales) => {
      this.sales = sales;
      this.renderSales();
      this.updateDashboard();
    });
    this.unsubscribers.push(salesUnsub);
  }

  async loadAllData() {
    try {
      // Initial data load (real-time listeners will handle updates)
      this.products = await firebaseService.getProducts();
      this.sales = await firebaseService.getSales();
      
      this.renderProducts();
      this.renderSales();
      this.updateDashboard();
      this.updateSaleProductDropdown();
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }

  showCreateShopForm() {
    document.getElementById('create-shop-form').style.display = 'block';
    document.getElementById('join-shop-form').style.display = 'none';
  }

  showJoinShopForm() {
    document.getElementById('join-shop-form').style.display = 'block';
    document.getElementById('create-shop-form').style.display = 'none';
  }

  hideShopForms() {
    document.getElementById('create-shop-form').style.display = 'none';
    document.getElementById('join-shop-form').style.display = 'none';
  }

  async createShop() {
    const shopName = document.getElementById('new-shop-name').value.trim();
    if (!shopName) {
      alert('Please enter a shop name');
      return;
    }

    try {
      const shop = await firebaseService.createShop(shopName);
      await this.selectShop(shop);
    } catch (error) {
      console.error('Failed to create shop:', error);
      alert('Failed to create shop: ' + error.message);
    }
  }

  async joinShop() {
    const shopName = document.getElementById('join-shop-name').value.trim();
    const shopId = document.getElementById('join-shop-id').value.trim();

    if (!shopName && !shopId) {
      alert('Please enter shop name or shop ID');
      return;
    }

    try {
      const shop = await firebaseService.joinShop(shopId, shopName);
      await this.selectShop(shop);
    } catch (error) {
      console.error('Failed to join shop:', error);
      alert('Failed to join shop: ' + error.message);
    }
  }

  switchTab(tabName) {
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.toggle('active', tab.id === tabName);
    });

    // Load tab-specific data
    if (tabName === 'activity') {
      this.loadActivityLogs();
    } else if (tabName === 'reports') {
      this.updateReports();
    }
  }

  // Product Management
  showProductModal(product = null) {
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('product-modal-title');
    const form = document.getElementById('product-form');
    
    if (product) {
      title.textContent = 'Edit Product';
      document.getElementById('product-id').value = product.id;
      document.getElementById('product-name').value = product.name;
      document.getElementById('product-cost').value = product.costPrice;
      document.getElementById('product-price').value = product.sellingPrice;
      document.getElementById('product-quantity').value = product.quantity;
      document.getElementById('product-description').value = product.description || '';
    } else {
      title.textContent = 'Add Product';
      form.reset();
      document.getElementById('product-id').value = '';
    }
    
    modal.style.display = 'block';
  }

  async handleProductSubmit(e) {
    e.preventDefault();
    
    const productData = {
      name: document.getElementById('product-name').value,
      costPrice: parseFloat(document.getElementById('product-cost').value),
      sellingPrice: parseFloat(document.getElementById('product-price').value),
      quantity: parseInt(document.getElementById('product-quantity').value),
      description: document.getElementById('product-description').value
    };

    const productId = document.getElementById('product-id').value;

    try {
      if (productId) {
        await firebaseService.updateProduct(productId, productData);
        await firebaseService.logActivity('update_product', `Updated product: ${productData.name}`);
      } else {
        await firebaseService.addProduct(productData);
        await firebaseService.logActivity('add_product', `Added product: ${productData.name}`);
      }
      
      this.closeModal('product-modal');
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Failed to save product: ' + error.message);
    }
  }

  async deleteProduct(productId, productName) {
    if (!confirm(`Are you sure you want to delete "${productName}"?`)) return;

    try {
      await firebaseService.deleteProduct(productId);
      await firebaseService.logActivity('delete_product', `Deleted product: ${productName}`);
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product: ' + error.message);
    }
  }

  renderProducts() {
    const container = document.getElementById('products-list');
    
    if (this.products.length === 0) {
      container.innerHTML = '<div class="empty-state">No products yet. Add your first product!</div>';
      return;
    }

    container.innerHTML = this.products.map(product => `
      <div class="product-item">
        <div class="product-header">
          <h3>${product.name}</h3>
          <div class="product-actions">
            <button onclick="app.showProductModal(${JSON.stringify(product).replace(/"/g, '&quot;')})" class="btn-secondary">Edit</button>
            <button onclick="app.deleteProduct('${product.id}', '${product.name}')" class="btn-danger">Delete</button>
          </div>
        </div>
        <div class="product-details">
          <p><strong>Cost:</strong> R${product.costPrice?.toFixed(2)}</p>
          <p><strong>Price:</strong> R${product.sellingPrice?.toFixed(2)}</p>
          <p><strong>Stock:</strong> ${product.quantity}</p>
          ${product.description ? `<p><strong>Description:</strong> ${product.description}</p>` : ''}
        </div>
        <div class="product-status ${product.quantity <= 3 ? 'low-stock' : ''}">
          ${product.quantity <= 3 ? '⚠️ Low Stock' : '✅ In Stock'}
        </div>
      </div>
    `).join('');
  }

  // Sales Management
  updateSaleProductDropdown() {
    const select = document.getElementById('sale-product');
    const currentValue = select.value;
    
    select.innerHTML = '<option value="">Select Product</option>' +
      this.products.filter(p => p.quantity > 0).map(product => 
        `<option value="${product.id}" ${currentValue === product.id ? 'selected' : ''}>
          ${product.name} (Stock: ${product.quantity})
        </option>`
      ).join('');
  }

  async handleSaleSubmit(e) {
    e.preventDefault();
    
    const productId = document.getElementById('sale-product').value;
    const quantity = parseInt(document.getElementById('sale-quantity').value);
    
    const product = this.products.find(p => p.id === productId);
    if (!product) {
      alert('Please select a product');
      return;
    }
    
    if (quantity > product.quantity) {
      alert('Not enough stock available');
      return;
    }

    try {
      const totalPrice = product.sellingPrice * quantity;
      const profit = (product.sellingPrice - product.costPrice) * quantity;
      
      // Record sale
      await firebaseService.addSale({
        productId: product.id,
        productName: product.name,
        quantitySold: quantity,
        totalPrice,
        profit
      });
      
      // Update product stock
      await firebaseService.updateProduct(productId, {
        quantity: product.quantity - quantity
      });
      
      await firebaseService.logActivity('record_sale', 
        `Sold ${quantity}x ${product.name} (R${totalPrice.toFixed(2)})`);
      
      // Reset form
      document.getElementById('sale-form').reset();
      
      alert(`Sale recorded! R${totalPrice.toFixed(2)} (Profit: R${profit.toFixed(2)})`);
    } catch (error) {
      console.error('Failed to record sale:', error);
      alert('Failed to record sale: ' + error.message);
    }
  }

  renderSales() {
    const container = document.getElementById('sales-list');
    
    if (this.sales.length === 0) {
      container.innerHTML = '<div class="empty-state">No sales recorded yet.</div>';
      return;
    }

    container.innerHTML = this.sales.map(sale => `
      <div class="sale-item">
        <div class="sale-header">
          <h4>${sale.productName}</h4>
          <span class="sale-date">${sale.saleDate?.toLocaleDateString()}</span>
        </div>
        <div class="sale-details">
          <span>Qty: ${sale.quantitySold}</span>
          <span>Total: R${sale.totalPrice?.toFixed(2)}</span>
          <span>Profit: R${sale.profit?.toFixed(2)}</span>
          <span>By: ${sale.employeeName}</span>
        </div>
      </div>
    `).join('');
  }

  filterSales(date) {
    // This would filter the sales display - implement based on needs
    console.log('Filter sales by date:', date);
  }

  // Dashboard Updates
  updateDashboard() {
    const totalProducts = this.products.length;
    const totalStock = this.products.reduce((sum, p) => sum + p.quantity, 0);
    const stockValue = this.products.reduce((sum, p) => sum + (p.quantity * p.costPrice), 0);
    
    const today = new Date().toDateString();
    const todaysSales = this.sales.filter(s => s.saleDate?.toDateString() === today);
    const todaysRevenue = todaysSales.reduce((sum, s) => sum + s.totalPrice, 0);

    document.getElementById('total-products').textContent = totalProducts;
    document.getElementById('total-stock').textContent = totalStock;
    document.getElementById('stock-value').textContent = `R${stockValue.toFixed(2)}`;
    document.getElementById('todays-sales').textContent = `R${todaysRevenue.toFixed(2)}`;

    // Low stock items
    const lowStockItems = this.products.filter(p => p.quantity <= 3);
    const lowStockContainer = document.getElementById('low-stock-list');
    
    if (lowStockItems.length === 0) {
      lowStockContainer.innerHTML = '<p>No low stock items</p>';
    } else {
      lowStockContainer.innerHTML = lowStockItems.map(item => 
        `<div class="low-stock-item">
          <strong>${item.name}</strong>: ${item.quantity} remaining
        </div>`
      ).join('');
    }

    // Recent sales
    const recentSales = this.sales.slice(0, 5);
    const recentSalesContainer = document.getElementById('recent-sales-list');
    
    if (recentSales.length === 0) {
      recentSalesContainer.innerHTML = '<p>No recent sales</p>';
    } else {
      recentSalesContainer.innerHTML = recentSales.map(sale => 
        `<div class="recent-sale-item">
          <strong>${sale.productName}</strong> - Qty: ${sale.quantitySold} - R${sale.totalPrice?.toFixed(2)}
        </div>`
      ).join('');
    }
  }

  // Activity Logs
  async loadActivityLogs() {
    try {
      const logs = await firebaseService.getActivityLogs();
      const container = document.getElementById('activity-list');
      
      if (logs.length === 0) {
        container.innerHTML = '<div class="empty-state">No activity recorded yet.</div>';
        return;
      }

      container.innerHTML = logs.map(log => `
        <div class="activity-item">
          <div class="activity-header">
            <span class="activity-action">${log.action}</span>
            <span class="activity-time">${log.timestamp?.toLocaleString()}</span>
          </div>
          <div class="activity-details">${log.details}</div>
          <div class="activity-user">By: ${log.userName}</div>
        </div>
      `).join('');
    } catch (error) {
      console.error('Failed to load activity logs:', error);
    }
  }

  // Reports
  updateReports() {
    // Implement reporting logic
    console.log('Update reports');
  }

  // Utility
  closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
  }
}

// Global app instance
window.app = new SpazaApp();