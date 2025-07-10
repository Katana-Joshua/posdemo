import jwt from 'jsonwebtoken';
import { getPool } from './_db.js';

export async function authenticateToken(req, res) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const pool = getPool();
    const [rows] = await pool.execute('SELECT id, email, role, name FROM users WHERE id = ?', [decoded.userId]);
    if (rows.length === 0) {
      res.status(401).json({ error: 'Invalid token' });
      return null;
    }
    return rows[0];
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
    return null;
  }
} 