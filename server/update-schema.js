import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'moonland_pos',
};

async function updateSchema() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Check if image column exists in categories table
    const [categoryColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'image'
    `, [dbConfig.database]);
    
    if (categoryColumns.length === 0) {
      console.log('📝 Adding image column to categories table...');
      await connection.execute('ALTER TABLE categories ADD COLUMN image TEXT');
      console.log('✅ Image column added to categories table');
    } else {
      console.log('ℹ️  Image column already exists in categories table');
    }
    
    // Check if image column exists in inventory table
    const [inventoryColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'inventory' AND COLUMN_NAME = 'image'
    `, [dbConfig.database]);
    
    if (inventoryColumns.length === 0) {
      console.log('📝 Adding image column to inventory table...');
      await connection.execute('ALTER TABLE inventory ADD COLUMN image TEXT');
      console.log('✅ Image column added to inventory table');
    } else {
      console.log('ℹ️  Image column already exists in inventory table');
    }
    
    console.log('✅ Schema update completed');
    
  } catch (error) {
    console.error('❌ Schema update failed:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

updateSchema(); 