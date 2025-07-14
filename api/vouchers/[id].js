import { getPool } from '../_db.js';
import { authenticateToken } from '../_auth.js';

export default async function handler(req, res) {
  const pool = getPool();
  const { id } = req.query;

  if (!id) return res.status(400).json({ error: 'Missing id' });

  const user = await authenticateToken(req, res);
  if (!user) return;

  if (req.method === 'PUT') {
    const { date, type, narration, debit_account, credit_account, amount } = req.body;
    
    if (!date || !type || !debit_account || !credit_account || !amount) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (debit_account === credit_account) {
      return res.status(400).json({ error: 'Debit and credit accounts must be different' });
    }
    
    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than zero' });
    }
    
    // Validate that accounts exist
    try {
      const [accountCheck] = await pool.execute(
        'SELECT COUNT(*) as count FROM accounts WHERE name IN (?, ?)',
        [debit_account, credit_account]
      );
      
      if (accountCheck[0].count !== 2) {
        return res.status(400).json({ error: 'One or both accounts do not exist' });
      }
    } catch (error) {
      return res.status(500).json({ error: 'Server error', details: error.message });
    }
    
    try {
      await pool.execute(
        'UPDATE vouchers SET date = ?, type = ?, narration = ?, debit_account = ?, credit_account = ?, amount = ? WHERE id = ?',
        [date, type, narration || null, debit_account, credit_account, amount, id]
      );
      
      const [updatedVoucher] = await pool.execute(`
        SELECT v.*, u.name as created_by_name 
        FROM vouchers v 
        LEFT JOIN users u ON v.created_by = u.id 
        WHERE v.id = ?
      `, [id]);
      
      if (updatedVoucher.length === 0) {
        return res.status(404).json({ error: 'Voucher not found' });
      }
      
      res.status(200).json(updatedVoucher[0]);
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const [result] = await pool.execute('DELETE FROM vouchers WHERE id = ?', [id]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Voucher not found' });
      }
      
      res.status(200).json({ message: 'Voucher deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
} 