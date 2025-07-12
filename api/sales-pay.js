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
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can mark credit sales as paid' });
  }
  if (!id) return res.status(400).json({ error: 'Missing id' });

  try {
    // Only update if status is unpaid
    const [result] = await pool.execute('UPDATE sales SET status = ? WHERE id = ? AND status = ?', ['paid', id, 'unpaid']);
    if (result.affectedRows === 0) {
      return res.status(400).json({ error: 'Sale not found or already paid' });
    }
    const [updatedSaleRows] = await pool.execute('SELECT * FROM sales WHERE id = ?', [id]);
    res.status(200).json(updatedSaleRows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
}