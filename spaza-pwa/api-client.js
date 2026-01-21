// API Configuration
const API_BASE_URL = 'http://localhost:8000/api';

// Store token
let authToken = localStorage.getItem('spaza_token');
let currentUser = null;

// API Helper
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  try {
    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 401) {
      // Token expired or invalid
      logout();
      throw new Error('Session expired. Please login again.');
    }
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Request failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ===== AUTH FUNCTIONS =====

async function register(username, email, password, fullName, role = 'employee') {
  const data = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password, full_name: fullName, role })
  });
  
  authToken = data.access_token;
  currentUser = data.user;
  localStorage.setItem('spaza_token', authToken);
  localStorage.setItem('spaza_user', JSON.stringify(currentUser));
  
  return data;
}

async function login(username, password) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  
  authToken = data.access_token;
  currentUser = data.user;
  localStorage.setItem('spaza_token', authToken);
  localStorage.setItem('spaza_user', JSON.stringify(currentUser));
  
  return data;
}

function logout() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('spaza_token');
  localStorage.removeItem('spaza_user');
  window.location.reload();
}

async function getCurrentUser() {
  if (!authToken) return null;
  try {
    currentUser = await apiRequest('/auth/me');
    localStorage.setItem('spaza_user', JSON.stringify(currentUser));
    return currentUser;
  } catch (error) {
    logout();
    return null;
  }
}

function isLoggedIn() {
  return !!authToken;
}

// ===== PRODUCT FUNCTIONS =====

async function getProducts() {
  return await apiRequest('/products');
}

async function createProduct(name, costPrice, sellingPrice, quantity) {
  return await apiRequest('/products', {
    method: 'POST',
    body: JSON.stringify({
      name,
      cost_price: costPrice,
      selling_price: sellingPrice,
      quantity
    })
  });
}

async function updateProductQuantity(productId, quantity) {
  return await apiRequest(`/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity })
  });
}

async function deleteProduct(productId) {
  return await apiRequest(`/products/${productId}`, {
    method: 'DELETE'
  });
}

// ===== SALES FUNCTIONS =====

async function recordSale(productId, quantitySold) {
  return await apiRequest('/sales', {
    method: 'POST',
    body: JSON.stringify({
      product_id: productId,
      quantity_sold: quantitySold
    })
  });
}

async function getSales(date = null) {
  const endpoint = date ? `/sales?date=${date}` : '/sales';
  return await apiRequest(endpoint);
}

// ===== STATS FUNCTIONS =====

async function getStats() {
  return await apiRequest('/stats');
}

// ===== ACTIVITY FUNCTIONS (Admin) =====

async function getActivityLogs(limit = 50) {
  return await apiRequest(`/activity?limit=${limit}`);
}

// Initialize on load
if (authToken) {
  getCurrentUser().catch(() => logout());
}

// Export for use in modules
export {
  register,
  login,
  logout,
  getCurrentUser,
  isLoggedIn,
  getProducts,
  createProduct,
  updateProductQuantity,
  deleteProduct,
  recordSale,
  getSales,
  getStats,
  getActivityLogs,
  currentUser
};
