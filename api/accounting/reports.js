import { getPool } from '../_db.js';
import { authenticateToken } from '../_auth.js';

export default async function handler(req, res) {
  const pool = getPool();
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Auth required
  const user = await authenticateToken(req, res);
  if (!user) return;

  const { report } = req.query;

  try {
    // Get all accounts
    const [accounts] = await pool.execute('SELECT * FROM accounts ORDER BY name');
    
    // Get all vouchers
    const [vouchers] = await pool.execute('SELECT * FROM vouchers ORDER BY date, created_at');
    
    // Get all sales for revenue and COGS
    const [sales] = await pool.execute('SELECT * FROM sales WHERE status = "paid"');
    
    // Get all expenses
    const [expenses] = await pool.execute('SELECT * FROM expenses');
    
    // Build ledger data (same logic as ledgers.js)
    const ledgerData = {};
    
    // Initialize all accounts
    accounts.forEach(acc => {
      ledgerData[acc.name] = {
        account: acc,
        transactions: [],
        balance: 0
      };
    });
    
    // Process vouchers
    vouchers.forEach(voucher => {
      const debitAccount = voucher.debit_account;
      const creditAccount = voucher.credit_account;
      
      if (!ledgerData[debitAccount]) {
        ledgerData[debitAccount] = { account: null, transactions: [], balance: 0 };
      }
      if (!ledgerData[creditAccount]) {
        ledgerData[creditAccount] = { account: null, transactions: [], balance: 0 };
      }
      
      // Add debit entry
      ledgerData[debitAccount].transactions.push({
        date: voucher.date,
        type: 'debit',
        amount: voucher.amount,
        narration: voucher.narration,
        voucher_number: voucher.voucher_number,
        source: 'voucher'
      });
      
      // Add credit entry
      ledgerData[creditAccount].transactions.push({
        date: voucher.date,
        type: 'credit',
        amount: voucher.amount,
        narration: voucher.narration,
        voucher_number: voucher.voucher_number,
        source: 'voucher'
      });
    });
    
    // Process sales (revenue and cash/bank)
    sales.forEach(sale => {
      const cashAccount = 'Cash/Bank';
      const salesAccount = 'Sales';
      const cogsAccount = 'Cost of Goods Sold';
      const inventoryAccount = 'Inventory';
      
      // Sales revenue
      if (!ledgerData[salesAccount]) {
        ledgerData[salesAccount] = { account: null, transactions: [], balance: 0 };
      }
      if (!ledgerData[cashAccount]) {
        ledgerData[cashAccount] = { account: null, transactions: [], balance: 0 };
      }
      
      ledgerData[salesAccount].transactions.push({
        date: sale.created_at.split('T')[0],
        type: 'credit',
        amount: sale.total,
        narration: `Sale #${sale.receipt_number}`,
        source: 'sale'
      });
      
      ledgerData[cashAccount].transactions.push({
        date: sale.created_at.split('T')[0],
        type: 'debit',
        amount: sale.total,
        narration: `Sale #${sale.receipt_number}`,
        source: 'sale'
      });
      
      // COGS entries
      if (!ledgerData[cogsAccount]) {
        ledgerData[cogsAccount] = { account: null, transactions: [], balance: 0 };
      }
      if (!ledgerData[inventoryAccount]) {
        ledgerData[inventoryAccount] = { account: null, transactions: [], balance: 0 };
      }
      
      const costOfGoods = sale.total_cost || (sale.total - (sale.profit || 0));
      
      ledgerData[cogsAccount].transactions.push({
        date: sale.created_at.split('T')[0],
        type: 'debit',
        amount: costOfGoods,
        narration: `COGS for Sale #${sale.receipt_number}`,
        source: 'sale'
      });
      
      ledgerData[inventoryAccount].transactions.push({
        date: sale.created_at.split('T')[0],
        type: 'credit',
        amount: costOfGoods,
        narration: `COGS for Sale #${sale.receipt_number}`,
        source: 'sale'
      });
    });
    
    // Process expenses
    expenses.forEach(expense => {
      const cashAccount = 'Cash/Bank';
      const expenseAccount = 'Expenses';
      
      if (!ledgerData[expenseAccount]) {
        ledgerData[expenseAccount] = { account: null, transactions: [], balance: 0 };
      }
      if (!ledgerData[cashAccount]) {
        ledgerData[cashAccount] = { account: null, transactions: [], balance: 0 };
      }
      
      ledgerData[expenseAccount].transactions.push({
        date: expense.created_at.split('T')[0],
        type: 'debit',
        amount: expense.amount,
        narration: expense.description,
        source: 'expense'
      });
      
      ledgerData[cashAccount].transactions.push({
        date: expense.created_at.split('T')[0],
        type: 'credit',
        amount: expense.amount,
        narration: expense.description,
        source: 'expense'
      });
    });
    
    // Calculate balances for each account
    Object.keys(ledgerData).forEach(accountName => {
      const ledger = ledgerData[accountName];
      let balance = 0;
      
      // Sort transactions by date
      ledger.transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      ledger.transactions.forEach(transaction => {
        if (transaction.type === 'debit') {
          balance += transaction.amount;
        } else {
          balance -= transaction.amount;
        }
        transaction.running_balance = balance;
      });
      
      ledger.balance = balance;
    });
    
    // Generate requested report
    let reportData = {};
    
    switch (report) {
      case 'trial-balance':
        reportData = generateTrialBalance(ledgerData, accounts);
        break;
      case 'profit-loss':
        reportData = generateProfitAndLoss(ledgerData);
        break;
      case 'balance-sheet':
        reportData = generateBalanceSheet(ledgerData);
        break;
      default:
        return res.status(400).json({ error: 'Invalid report type. Use: trial-balance, profit-loss, or balance-sheet' });
    }
    
    res.status(200).json(reportData);
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
}

function generateTrialBalance(ledgerData, accounts) {
  const trialBalance = {};
  let totalDebit = 0;
  let totalCredit = 0;
  
  Object.entries(ledgerData).forEach(([accountName, data]) => {
    const accountInfo = accounts.find(a => a.name === accountName);
    const accountType = accountInfo ? accountInfo.type : '';
    const isDebitNormal = ['Asset', 'Expense'].includes(accountType);
    
    if (data.balance > 0) {
      if (isDebitNormal) {
        trialBalance[accountName] = { debit: data.balance, credit: 0 };
        totalDebit += data.balance;
      } else {
        trialBalance[accountName] = { debit: 0, credit: data.balance };
        totalCredit += data.balance;
      }
    } else if (data.balance < 0) {
      if (isDebitNormal) {
        trialBalance[accountName] = { debit: 0, credit: -data.balance };
        totalCredit += -data.balance;
      } else {
        trialBalance[accountName] = { debit: -data.balance, credit: 0 };
        totalDebit += -data.balance;
      }
    }
  });
  
  return {
    accounts: trialBalance,
    totals: { debit: totalDebit, credit: totalCredit },
    balanced: Math.abs(totalDebit - totalCredit) < 0.01
  };
}

function generateProfitAndLoss(ledgerData) {
  const revenue = ledgerData['Sales']?.balance || 0;
  const cogs = ledgerData['Cost of Goods Sold']?.balance || 0;
  const grossProfit = revenue - cogs;
  const operatingExpenses = ledgerData['Expenses']?.balance || 0;
  const netProfit = grossProfit - operatingExpenses;
  
  return {
    revenue,
    costOfGoodsSold: cogs,
    grossProfit,
    operatingExpenses,
    netProfit
  };
}

function generateBalanceSheet(ledgerData) {
  const assets = {
    cashAndBank: ledgerData['Cash/Bank']?.balance || 0,
    accountsReceivable: ledgerData['Accounts Receivable']?.balance || 0,
    inventory: ledgerData['Inventory']?.balance || 0,
  };
  assets.total = Object.values(assets).reduce((sum, val) => sum + val, 0);
  
  const liabilities = {
    accountsPayable: ledgerData['Accounts Payable']?.balance || 0,
  };
  
  const equity = {
    retainedEarnings: (ledgerData['Sales']?.balance || 0) - (ledgerData['Cost of Goods Sold']?.balance || 0) - (ledgerData['Expenses']?.balance || 0),
  };
  
  liabilities.total = (liabilities.accountsPayable || 0);
  equity.total = equity.retainedEarnings;
  
  return { assets, liabilities, equity };
} 