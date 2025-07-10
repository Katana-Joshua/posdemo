import { getPool } from '../../_db.js';
import { authenticateToken } from '../../_auth.js';

export default async function handler(req, res) {
  const pool = getPool();
  const { id } = req.query;

  if (req.method === 'PUT') {
    const user = await authenticateToken(req, res);
    if (!user) return;
    const { quantity } = req.body;
    if (typeof quantity !== 'number') {
      return res.status(400).json({ error: 'Quantity must be a number' });
    }
    try {
      await pool.execute('UPDATE inventory SET stock = ? WHERE id = ?', [quantity, id]);
      res.status(200).json({ message: 'Stock updated successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
} 