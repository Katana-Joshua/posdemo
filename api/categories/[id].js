import { getPool } from '../_db.js';
import { authenticateToken } from '../_auth.js';

export default async function handler(req, res) {
  const pool = getPool();
  const { id } = req.query;

  if (req.method === 'PUT') {
    // Auth required
    const user = await authenticateToken(req, res);
    if (!user) return;
    const { name, image } = req.body;
    try {
      if (name) {
        await pool.execute('UPDATE categories SET name = ? WHERE id = ?', [name, id]);
      }
      if (image !== undefined) {
        await pool.execute('UPDATE categories SET image = ? WHERE id = ?', [image, id]);
      }
      const [updatedCategory] = await pool.execute('SELECT * FROM categories WHERE id = ?', [id]);
      res.status(200).json(updatedCategory[0]);
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  } else if (req.method === 'DELETE') {
    // Auth required
    const user = await authenticateToken(req, res);
    if (!user) return;
    try {
      await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
      res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
} 