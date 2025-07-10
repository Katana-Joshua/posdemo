import { getPool } from './_db.js';
import { authenticateToken } from './_auth.js';

export default async function handler(req, res) {
  const pool = getPool();
  const { id } = req.query;

  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const user = await authenticateToken(req, res);
  if (!user) return;
  // Removed admin check so both admins and cashiers can update stock
  if (!id) return res.status(400).json({ error: 'Missing id' });

  try {
    const { quantity } = req.body;
    if (typeof quantity !== 'number' || isNaN(quantity)) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }
    await pool.execute('UPDATE inventory SET stock = ? WHERE id = ?', [quantity, id]);
    const [updatedItem] = await pool.execute('SELECT * FROM inventory WHERE id = ?', [id]);
    res.status(200).json(updatedItem[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
} 