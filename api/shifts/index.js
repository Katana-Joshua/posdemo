import { getPool } from '../_db.js';
import { authenticateToken } from '../_auth.js';

export default async function handler(req, res) {
  const pool = getPool();
  if (req.method === 'GET') {
    // Auth required
    const user = await authenticateToken(req, res);
    if (!user) return;
    try {
      const [rows] = await pool.execute('SELECT * FROM shifts ORDER BY start_time DESC');
      res.status(200).json(rows);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  } else if (req.method === 'POST') {
    const user = await authenticateToken(req, res);
    if (!user) return;
    const { cashierName, startTime, startingCash } = req.body;
    if (!cashierName || !startTime || startingCash == null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
      const [result] = await pool.execute(
        'INSERT INTO shifts (cashier_name, start_time, starting_cash) VALUES (?, ?, ?)',
        [cashierName, startTime, startingCash]
      );
      res.status(201).json({ id: result.insertId, cashierName, startTime, startingCash });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
} 