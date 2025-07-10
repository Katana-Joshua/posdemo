import bcrypt from 'bcryptjs';
import { getPool } from './_db';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email, password, name, role = 'cashier' } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    const pool = getPool();
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.execute(
      'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, name, role]
    );
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
} 