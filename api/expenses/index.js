import { getPool } from '../_db.js';
import { authenticateToken } from '../_auth.js';

export default async function handler(req, res) {
  const pool = getPool();
  if (req.method === 'GET') {
    // Auth required
    const user = await authenticateToken(req, res);
    if (!user) return;
    try {
      const [rows] = await pool.execute('SELECT * FROM expenses ORDER BY created_at DESC');
      res.status(200).json(rows);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  } else if (req.method === 'POST') {
    // Auth required
    const user = await authenticateToken(req, res);
    if (!user) return;
    let { description, amount, category, cashier_name } = req.body;
    // Ensure no undefined values are passed to SQL
    description = description ?? null;
    amount = amount ?? null;
    category = category ?? null;
    cashier_name = cashier_name ?? null;
    try {
      const [result] = await pool.execute(
        'INSERT INTO expenses (description, amount, category, cashier_name) VALUES (?, ?, ?, ?)',
        [description, amount, category, cashier_name]
      );
      const [newExpense] = await pool.execute('SELECT * FROM expenses WHERE id = ?', [result.insertId]);
      res.status(201).json(newExpense[0]);
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
} 