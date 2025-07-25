import { getPool } from '../_db.js';
import { authenticateToken } from '../_auth.js';

export default async function handler(req, res) {
  const pool = getPool();
  if (req.method === 'GET') {
    // Auth required
    const user = await authenticateToken(req, res);
    if (!user) return;
    try {
      const [rows] = await pool.execute('SELECT * FROM categories ORDER BY name');
      res.status(200).json(rows);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  } else if (req.method === 'POST') {
    // Auth required
    const user = await authenticateToken(req, res);
    if (!user) return;
    const { name, image } = req.body;
    try {
      const [result] = await pool.execute('INSERT INTO categories (name, image) VALUES (?, ?)', [name, image]);
      const [newCategory] = await pool.execute('SELECT * FROM categories WHERE id = ?', [result.insertId]);
      res.status(201).json(newCategory[0]);
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
} 