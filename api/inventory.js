import { getPool } from './_db.js';
import { authenticateToken } from './_auth.js';

export default async function handler(req, res) {
  const pool = getPool();
  if (req.method === 'GET') {
    // Auth required
    const user = await authenticateToken(req, res);
    if (!user) return;
    try {
      const [rows] = await pool.execute(`
        SELECT i.*, c.name as category_name 
        FROM inventory i 
        LEFT JOIN categories c ON i.category_id = c.id
        ORDER BY i.name
      `);
      res.status(200).json(rows);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  } else if (req.method === 'POST') {
    // Auth required
    const user = await authenticateToken(req, res);
    if (!user) return;
    const { name, description, price, cost_price, stock, low_stock_alert, category_id, image } = req.body;
    try {
      const [result] = await pool.execute(
        'INSERT INTO inventory (name, description, price, cost_price, stock, low_stock_alert, category_id, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [name, description, price, cost_price, stock, low_stock_alert, category_id, image]
      );
      const [newItem] = await pool.execute(
        `SELECT i.*, c.name as category_name FROM inventory i LEFT JOIN categories c ON i.category_id = c.id WHERE i.id = ?`,
        [result.insertId]
      );
      res.status(201).json(newItem[0]);
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  } else if (req.method === 'DELETE') {
    // Auth required
    const user = await authenticateToken(req, res);
    if (!user) return;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete inventory items' });
    }
    // Support both /api/inventory/:id and body { id }
    let id = req.body && req.body.id;
    if (!id && req.url && req.url !== '/') {
      // Try to extract id from URL (e.g., /2)
      const match = req.url.match(/^\/(\d+)/);
      if (match) id = match[1];
    }
    if (!id) return res.status(400).json({ error: 'Missing id' });
    try {
      await pool.execute('DELETE FROM inventory WHERE id = ?', [id]);
      res.status(200).json({ message: 'Inventory item deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
} 