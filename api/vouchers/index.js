import { getPool } from '../_db.js';
import { authenticateToken } from '../_auth.js';

export default async function handler(req, res) {
  const pool = getPool();
  
  if (req.method === 'GET') {
    // Auth required
    const user = await authenticateToken(req, res);
    if (!user) return;
    
    try {
      const [rows] = await pool.execute(`
        SELECT v.*, u.name as created_by_name 
        FROM vouchers v 
        LEFT JOIN users u ON v.created_by = u.id 
        ORDER BY v.date DESC, v.created_at DESC
      `);
      res.status(200).json(rows);
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  } else if (req.method === 'POST') {
    // Auth required
    const user = await authenticateToken(req, res);
    if (!user) return;
    
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
    
    // Generate voucher number
    const voucherNumber = `V-${Date.now()}`;
    
    try {
      const [result] = await pool.execute(
        'INSERT INTO vouchers (voucher_number, date, type, narration, debit_account, credit_account, amount, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [voucherNumber, date, type, narration || null, debit_account, credit_account, amount, user.id]
      );
      
      const [newVoucher] = await pool.execute(`
        SELECT v.*, u.name as created_by_name 
        FROM vouchers v 
        LEFT JOIN users u ON v.created_by = u.id 
        WHERE v.id = ?
      `, [result.insertId]);
      
      res.status(201).json(newVoucher[0]);
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
} 