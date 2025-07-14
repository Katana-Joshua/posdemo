import { getPool } from '../_db.js';
import { authenticateToken } from '../_auth.js';

export default async function handler(req, res) {
  const pool = getPool();
  
  if (req.method === 'GET') {
    // Auth required
    const user = await authenticateToken(req, res);
    if (!user) return;
    
    try {
      const [rows] = await pool.execute('SELECT * FROM accounts ORDER BY name');
      res.status(200).json(rows);
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  } else if (req.method === 'POST') {
    // Auth required - only admins can create accounts
    const user = await authenticateToken(req, res);
    if (!user) return;
    
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create accounts' });
    }
    
    const { name, type, description } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }
    
    const validTypes = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid account type' });
    }
    
    try {
      const [result] = await pool.execute(
        'INSERT INTO accounts (name, type, description) VALUES (?, ?, ?)',
        [name, type, description || null]
      );
      
      const [newAccount] = await pool.execute('SELECT * FROM accounts WHERE id = ?', [result.insertId]);
      res.status(201).json(newAccount[0]);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Account name already exists' });
      }
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
} 