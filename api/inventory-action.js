import { getPool } from './_db.js';
import { authenticateToken } from './_auth.js';

export default async function handler(req, res) {
  const pool = getPool();
  const { id } = req.query;

  if (!id) return res.status(400).json({ error: 'Missing id' });

  const user = await authenticateToken(req, res);
  if (!user) return;

  if (req.method === 'DELETE') {
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete inventory items' });
    }
    try {
      await pool.execute('DELETE FROM inventory WHERE id = ?', [id]);
      return res.status(200).json({ message: 'Inventory item deleted successfully' });
    } catch (error) {
      return res.status(500).json({ error: 'Server error', details: error.message });
    }
  }

  if (req.method === 'PUT') {
    // Add admin check if needed
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update inventory items' });
    }
    const { name, description, price, cost_price, stock, low_stock_alert, category_id, image } = req.body;
    try {
      await pool.execute(
        'UPDATE inventory SET name=?, description=?, price=?, cost_price=?, stock=?, low_stock_alert=?, category_id=?, image=? WHERE id=?',
        [name, description, price, cost_price, stock, low_stock_alert, category_id, image, id]
      );
      const [updatedItem] = await pool.execute('SELECT * FROM inventory WHERE id = ?', [id]);
      return res.status(200).json(updatedItem[0]);
    } catch (error) {
      return res.status(500).json({ error: 'Server error', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
} 