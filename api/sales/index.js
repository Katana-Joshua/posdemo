import { getPool } from '../_db.js';
import { authenticateToken } from '../_auth.js';

export default async function handler(req, res) {
  const pool = getPool();
  if (req.method === 'GET') {
    // Auth required
    const user = await authenticateToken(req, res);
    if (!user) return;
    try {
      const [rows] = await pool.execute('SELECT * FROM sales ORDER BY created_at DESC');
      res.status(200).json(rows);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  } else if (req.method === 'POST') {
    // Auth required
    const user = await authenticateToken(req, res);
    if (!user) return;
    const { receipt_number, items, total, total_cost, profit, payment_method, customer_info, status, cashier_name } = req.body;
    try {
      const [result] = await pool.execute(
        'INSERT INTO sales (receipt_number, items, total, total_cost, profit, payment_method, customer_info, status, cashier_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [receipt_number, JSON.stringify(items), total, total_cost, profit, payment_method, JSON.stringify(customer_info), status, cashier_name]
      );
      const [newSale] = await pool.execute('SELECT * FROM sales WHERE id = ?', [result.insertId]);
      res.status(201).json(newSale[0]);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
} 