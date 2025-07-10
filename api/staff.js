import { getPool } from './_db.js';
import { authenticateToken } from './_auth.js';

export default async function handler(req, res) {
  const pool = getPool();
  if (req.method === 'GET') {
    // Auth required
    const user = await authenticateToken(req, res);
    if (!user) return;
    try {
      const [rows] = await pool.execute('SELECT id, email, role, name, created_at FROM users ORDER BY name');
      res.status(200).json(rows);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  } else if (req.method === 'DELETE') {
    // Auth required
    const user = await authenticateToken(req, res);
    if (!user) return;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete users' });
    }
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing id' });
    if (user.id === id) {
      return res.status(400).json({ error: 'Admin cannot delete themselves' });
    }
    try {
      await pool.execute('DELETE FROM users WHERE id = ?', [id]);
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
} 