import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mysql from 'mysql2/promise';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Utility function to handle undefined values
const sanitizeValue = (value) => value === undefined ? null : value;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Content-Length: ${req.headers['content-length'] || 'unknown'}`);
  next();
});

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'moonland_pos',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

// Initialize database connection
async function initializeDatabase() {
  try {
    pool = mysql.createPool(dbConfig);
    
    // Test connection
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    
    // Create tables if they don't exist
    await createTables();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Create database tables
async function createTables() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'cashier') DEFAULT 'cashier',
      name VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      image TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS inventory (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      cost_price DECIMAL(10,2) DEFAULT 0,
      stock INT DEFAULT 0,
      low_stock_alert INT DEFAULT 5,
      category_id INT,
      image TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    )`,
    
    `CREATE TABLE IF NOT EXISTS sales (
      id INT AUTO_INCREMENT PRIMARY KEY,
      receipt_number VARCHAR(255) UNIQUE NOT NULL,
      items JSON NOT NULL,
      total DECIMAL(10,2) NOT NULL,
      total_cost DECIMAL(10,2) DEFAULT 0,
      profit DECIMAL(10,2) DEFAULT 0,
      payment_method ENUM('cash', 'card', 'credit') NOT NULL,
      customer_info JSON,
      status ENUM('paid', 'unpaid') DEFAULT 'paid',
      cashier_name VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      paid_at TIMESTAMP NULL
    )`,
    
    `CREATE TABLE IF NOT EXISTS expenses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      description VARCHAR(255) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      category VARCHAR(255),
      cashier_name VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS shifts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      cashier_name VARCHAR(255) NOT NULL,
      start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      end_time TIMESTAMP NULL,
      starting_cash DECIMAL(10,2) DEFAULT 0,
      ending_cash DECIMAL(10,2) NULL,
      total_sales DECIMAL(10,2) DEFAULT 0,
      total_expenses DECIMAL(10,2) DEFAULT 0
    )`
  ];

  try {
    for (const table of tables) {
      await pool.execute(table);
    }
    console.log('✅ Database tables created/verified');
    
    // Insert default admin user if not exists
    await createDefaultAdmin();
  } catch (error) {
    console.error('❌ Error creating tables:', error);
  }
}

// Create default admin user
async function createDefaultAdmin() {
  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', ['admin@moonland.com']);
    if (rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.execute(
        'INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)',
        ['admin@moonland.com', hashedPassword, 'admin', 'Admin User']
      );
      console.log('✅ Default admin user created (admin@moonland.com / admin123)');
    }
  } catch (error) {
    console.error('❌ Error creating default admin:', error);
  }
}

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const [rows] = await pool.execute('SELECT id, email, role, name FROM users WHERE id = ?', [decoded.userId]);
    
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = rows[0];
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Auth routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name, role = 'cashier' } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    await pool.execute(
      'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, name, role]
    );

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Inventory routes
app.get('/api/inventory', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT i.*, c.name as category_name 
      FROM inventory i 
      LEFT JOIN categories c ON i.category_id = c.id
      ORDER BY i.name
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/inventory', authenticateToken, async (req, res) => {
  try {
    const { name, description, price, cost_price, stock, low_stock_alert, category_id, image } = req.body;
    
    console.log('Adding inventory item:', { name, description, price, cost_price, stock, low_stock_alert, category_id, hasImage: !!image });
    
    const [result] = await pool.execute(
      'INSERT INTO inventory (name, description, price, cost_price, stock, low_stock_alert, category_id, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        sanitizeValue(name), 
        sanitizeValue(description), 
        sanitizeValue(price), 
        sanitizeValue(cost_price), 
        sanitizeValue(stock), 
        sanitizeValue(low_stock_alert), 
        sanitizeValue(category_id), 
        sanitizeValue(image)
      ]
    );

    const [newItem] = await pool.execute(`
      SELECT i.*, c.name as category_name 
      FROM inventory i 
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE i.id = ?
    `, [result.insertId]);

    console.log('Successfully added inventory item:', newItem[0]);
    res.status(201).json(newItem[0]);
  } catch (error) {
    console.error('Inventory creation error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.put('/api/inventory/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, cost_price, stock, low_stock_alert, category_id, image } = req.body;
    
    console.log('Updating inventory item:', { id, name, description, price, cost_price, stock, low_stock_alert, category_id, hasImage: !!image });
    
    await pool.execute(
      'UPDATE inventory SET name = ?, description = ?, price = ?, cost_price = ?, stock = ?, low_stock_alert = ?, category_id = ?, image = ? WHERE id = ?',
      [
        sanitizeValue(name), 
        sanitizeValue(description), 
        sanitizeValue(price), 
        sanitizeValue(cost_price), 
        sanitizeValue(stock), 
        sanitizeValue(low_stock_alert), 
        sanitizeValue(category_id), 
        sanitizeValue(image), 
        id
      ]
    );

    const [updatedItem] = await pool.execute(`
      SELECT i.*, c.name as category_name 
      FROM inventory i 
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE i.id = ?
    `, [id]);

    console.log('Successfully updated inventory item:', updatedItem[0]);
    res.json(updatedItem[0]);
  } catch (error) {
    console.error('Inventory update error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.delete('/api/inventory/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM inventory WHERE id = ?', [id]);
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update stock (for sales)
app.put('/api/inventory/:id/stock', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    
    await pool.execute(
      'UPDATE inventory SET stock = stock - ? WHERE id = ? AND stock >= ?',
      [quantity, id, quantity]
    );

    res.json({ message: 'Stock updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Sales routes
app.get('/api/sales', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM sales ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/sales', authenticateToken, async (req, res) => {
  try {
    const { receipt_number, items, total, total_cost, profit, payment_method, customer_info, status, cashier_name } = req.body;
    
    const [result] = await pool.execute(
      'INSERT INTO sales (receipt_number, items, total, total_cost, profit, payment_method, customer_info, status, cashier_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [receipt_number, JSON.stringify(items), total, total_cost, profit, payment_method, JSON.stringify(customer_info), status, cashier_name]
    );

    const [newSale] = await pool.execute('SELECT * FROM sales WHERE id = ?', [result.insertId]);
    res.status(201).json(newSale[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/sales/:id/pay', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.execute(
      'UPDATE sales SET status = ?, paid_at = ? WHERE id = ?',
      ['paid', new Date(), id]
    );

    const [updatedSale] = await pool.execute('SELECT * FROM sales WHERE id = ?', [id]);
    res.json(updatedSale[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Categories routes
app.get('/api/categories', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM categories ORDER BY name');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/categories', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    const [result] = await pool.execute('INSERT INTO categories (name) VALUES (?)', [name]);
    const [newCategory] = await pool.execute('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    res.status(201).json(newCategory[0]);
  } catch (error) {
    console.error('Category creation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/categories/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, image } = req.body;
    
    if (name) {
      await pool.execute('UPDATE categories SET name = ? WHERE id = ?', [name, id]);
    }
    
    if (image !== undefined) {
      await pool.execute('UPDATE categories SET image = ? WHERE id = ?', [image, id]);
    }
    
    const [updatedCategory] = await pool.execute('SELECT * FROM categories WHERE id = ?', [id]);
    res.json(updatedCategory[0]);
  } catch (error) {
    console.error('Category update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Category deletion error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Expenses routes
app.get('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM expenses ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const { description, amount, category, cashier_name } = req.body;
    console.log('Adding expense:', { description, amount, category, cashier_name });
    const [result] = await pool.execute(
      'INSERT INTO expenses (description, amount, category, cashier_name) VALUES (?, ?, ?, ?)',
      [
        sanitizeValue(description),
        sanitizeValue(amount),
        sanitizeValue(category),
        sanitizeValue(cashier_name)
      ]
    );

    const [newExpense] = await pool.execute('SELECT * FROM expenses WHERE id = ?', [result.insertId]);
    res.status(201).json(newExpense[0]);
  } catch (error) {
    console.error('Expense creation error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Staff routes
app.get('/api/staff', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, email, role, name, created_at FROM users ORDER BY name');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ 
      error: 'Request entity too large',
      message: 'The uploaded file or data is too large. Please reduce the size and try again.'
    });
  }
  
  if (error.name === 'PayloadTooLargeError') {
    return res.status(413).json({ 
      error: 'Payload too large',
      message: 'The request payload is too large. Please reduce the data size and try again.'
    });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: 'Something went wrong on the server. Please try again.'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 API available at http://localhost:${PORT}/api`);
  });
}); 