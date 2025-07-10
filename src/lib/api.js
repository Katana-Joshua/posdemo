const API_BASE_URL = '';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}/api${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Request failed');
      }
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth methods
  async signUp(email, password, name, role = 'cashier') {
    return this.request('/auth_signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role }),
    });
  }

  async signIn(email, password) {
    const response = await this.request('/auth_signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('auth_user', JSON.stringify(response.user));
    return response;
  }

  signOut() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }

  // Inventory methods
  async getInventory() {
    return this.request('/inventory');
  }

  async addInventoryItem(item) {
    return this.request('/inventory', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  async updateInventoryItem(id, item) {
    return this.request(`/inventory-action?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
  }

  async deleteInventoryItem(id) {
    return this.request(`/inventory-action?id=${id}`, {
      method: 'DELETE',
    });
  }

  async updateStock(id, quantity) {
    return this.request(`/update-stock?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  // Sales methods
  async getSales() {
    return this.request('/sales');
  }

  async addSale(sale) {
    return this.request('/sales', {
      method: 'POST',
      body: JSON.stringify(sale),
    });
  }

  async payCreditSale(id) {
    return this.request(`/sales-pay?id=${id}`, {
      method: 'PUT',
    });
  }

  // Categories methods
  async getCategories() {
    return this.request('/categories');
  }

  async addCategory(category) {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  }

  async updateCategory(id, category) {
    return this.request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    });
  }

  async deleteCategory(id) {
    return this.request(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Expenses methods
  async getExpenses() {
    return this.request('/expenses');
  }

  async addExpense(expense) {
    return this.request('/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
  }

  // Staff methods
  async getStaff() {
    return this.request('/staff');
  }

  async deleteStaff(id) {
    return this.request(`/staff/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient(); 