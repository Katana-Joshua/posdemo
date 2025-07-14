import { getPool } from '../_db.js';
import { authenticateToken } from '../_auth.js';

export default async function handler(req, res) {
  const pool = getPool();
  const { id } = req.query;

  if (!id) return res.status(400).json({ error: 'Missing id' });

  const user = await authenticateToken(req, res);
  if (!user) return;

  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can modify accounts' });
  }

  if (req.method === 'PUT') {
    const { name, type, description } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }
    
    const validTypes = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid account type' });
    }
    
    try {
      await pool.execute(
        'UPDATE accounts SET name = ?, type = ?, description = ? WHERE id = ?',
        [name, type, description || null, id]
      );
      
      const [updatedAccount] = await pool.execute('SELECT * FROM accounts WHERE id = ?', [id]);
      if (updatedAccount.length === 0) {
        return res.status(404).json({ error: 'Account not found' });
      }
      
      res.status(200).json(updatedAccount[0]);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Account name already exists' });
      }
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      // Check if account is being used in vouchers
      const [voucherCheck] = await pool.execute(
        'SELECT COUNT(*) as count FROM vouchers WHERE debit_account = (SELECT name FROM accounts WHERE id = ?) OR credit_account = (SELECT name FROM accounts WHERE id = ?)',
        [id, id]
      );
      
      if (voucherCheck[0].count > 0) {
        return res.status(400).json({ error: 'Cannot delete account that has transactions' });
      }
      
      const [result] = await pool.execute('DELETE FROM accounts WHERE id = ?', [id]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Account not found' });
      }
      
      res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
} 