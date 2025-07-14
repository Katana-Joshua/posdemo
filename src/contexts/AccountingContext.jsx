import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { apiClient } from '@/lib/api.js';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { usePOS } from '@/contexts/POSContext';

const AccountingContext = createContext();

export const useAccounting = () => {
  const context = useContext(AccountingContext);
  if (!context) {
    throw new Error('useAccounting must be used within an AccountingProvider');
  }
  return context;
};

export const AccountingProvider = ({ children }) => {
  const { user } = useAuth();
  const { inventory } = usePOS();
  const [accounts, setAccounts] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingVouchers, setLoadingVouchers] = useState(true);
  const [loadingSales, setLoadingSales] = useState(true);
  const [loadingExpenses, setLoadingExpenses] = useState(true);

  // Admin-only access
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;
    setLoadingAccounts(true);
    apiClient.getAccounts().then(data => setAccounts(data || [])).catch(error => {
      toast({ title: 'Error fetching accounts', description: error.message, variant: 'destructive' });
    }).finally(() => setLoadingAccounts(false));
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    setLoadingVouchers(true);
    apiClient.getVouchers().then(data => setVouchers(data || [])).catch(error => {
      toast({ title: 'Error fetching vouchers', description: error.message, variant: 'destructive' });
    }).finally(() => setLoadingVouchers(false));
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    setLoadingSales(true);
    apiClient.getSales().then(data => {
      const normalized = (data || []).map(sale => {
        let customerInfo = sale.customer_info;
        if (typeof customerInfo === 'string') {
          try { customerInfo = JSON.parse(customerInfo); } catch { customerInfo = {}; }
        }
        let items = sale.items;
        if (typeof items === 'string') {
          try { items = JSON.parse(items); } catch { items = []; }
        }
        return {
          ...sale,
          total: sale.total !== undefined ? Number(sale.total) : 0,
          profit: sale.profit !== undefined ? Number(sale.profit) : 0,
          total_cost: sale.total_cost !== undefined ? Number(sale.total_cost) : 0,
          status: sale.status ? String(sale.status) : '',
          customerInfo,
          items,
          timestamp: sale.created_at || sale.timestamp,
          receiptNumber: sale.receipt_number || sale.receiptNumber,
          paymentMethod: sale.payment_method || sale.paymentMethod,
        };
      });
      setSales(normalized);
    }).catch(error => {
      toast({ title: 'Error fetching sales', description: error.message, variant: 'destructive' });
    }).finally(() => setLoadingSales(false));
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    setLoadingExpenses(true);
    apiClient.getExpenses().then(data => setExpenses(data || [])).catch(error => {
      toast({ title: 'Error fetching expenses', description: error.message, variant: 'destructive' });
    }).finally(() => setLoadingExpenses(false));
  }, [isAdmin]);

  // CRUD for accounts and vouchers (admin only)
  const addAccount = async (account) => {
    if (!isAdmin) return null;
    try {
      const newAccount = await apiClient.addAccount(account);
      setAccounts(prev => [...prev, newAccount]);
      toast({ title: 'Account Created', description: `Account "${newAccount.name}" has been successfully created.` });
      return newAccount;
    } catch (error) {
      toast({ title: 'Error adding account', description: error.message, variant: 'destructive' });
      return null;
    }
  };
  const updateAccount = async (id, account) => {
    if (!isAdmin) return null;
    try {
      const updatedAccount = await apiClient.updateAccount(id, account);
      setAccounts(prev => prev.map(acc => acc.id === id ? updatedAccount : acc));
      toast({ title: 'Account Updated', description: `Account "${updatedAccount.name}" has been successfully updated.` });
      return updatedAccount;
    } catch (error) {
      toast({ title: 'Error updating account', description: error.message, variant: 'destructive' });
      return null;
    }
  };
  const deleteAccount = async (id) => {
    if (!isAdmin) return false;
    try {
      await apiClient.deleteAccount(id);
      setAccounts(prev => prev.filter(acc => acc.id !== id));
      toast({ title: 'Account Deleted', description: 'Account has been successfully deleted.' });
      return true;
    } catch (error) {
      toast({ title: 'Error deleting account', description: error.message, variant: 'destructive' });
      return false;
    }
  };
  const addVoucher = async (voucher) => {
    if (!isAdmin) return null;
    try {
      const newVoucher = await apiClient.addVoucher(voucher);
      setVouchers(prev => [...prev, newVoucher]);
      toast({ title: 'Voucher Created', description: `Voucher ${newVoucher.type} for UGX ${newVoucher.amount} has been recorded.` });
      return newVoucher;
    } catch (error) {
      toast({ title: 'Error adding voucher', description: error.message, variant: 'destructive' });
      return null;
    }
  };
  const updateVoucher = async (id, voucher) => {
    if (!isAdmin) return null;
    try {
      const updatedVoucher = await apiClient.updateVoucher(id, voucher);
      setVouchers(prev => prev.map(v => v.id === id ? updatedVoucher : v));
      toast({ title: 'Voucher Updated', description: 'Voucher has been successfully updated.' });
      return updatedVoucher;
    } catch (error) {
      toast({ title: 'Error updating voucher', description: error.message, variant: 'destructive' });
      return null;
    }
  };
  const deleteVoucher = async (id) => {
    if (!isAdmin) return false;
    try {
      await apiClient.deleteVoucher(id);
      setVouchers(prev => prev.filter(v => v.id !== id));
      toast({ title: 'Voucher Deleted', description: 'Voucher has been successfully deleted.' });
      return true;
    } catch (error) {
      toast({ title: 'Error deleting voucher', description: error.message, variant: 'destructive' });
      return false;
    }
  };

  // In-memory computed transactions
  const transactions = useMemo(() => {
    if (!isAdmin) return [];
    const all = [];
    // Sales
    sales.forEach(sale => {
      all.push({
        id: `S-${sale.id}`,
        date: sale.timestamp,
        type: 'Sale',
        narration: `Sale to ${sale.paymentMethod === 'credit' ? sale.customerInfo?.name || 'Customer' : 'Customer'} (Receipt #${sale.receiptNumber})`,
        debit: { account: sale.paymentMethod === 'credit' ? 'Accounts Receivable' : 'Cash/Bank', amount: sale.total },
        credit: { account: 'Sales', amount: sale.total },
      });
      all.push({
        id: `COGS-${sale.id}`,
        date: sale.timestamp,
        type: 'COGS',
        narration: `Cost for Sale #${sale.receiptNumber}`,
        debit: { account: 'Cost of Goods Sold', amount: sale.total - sale.profit },
        credit: { account: 'Inventory', amount: sale.total - sale.profit },
      });
    });
    // Expenses
    expenses.forEach(expense => {
      all.push({
        id: `E-${expense.id}`,
        date: expense.timestamp,
        type: 'Expense',
        narration: expense.description,
        debit: { account: 'Expenses', amount: Number(expense.amount) },
        credit: { account: 'Cash/Bank', amount: Number(expense.amount) },
      });
    });
    // Vouchers
    vouchers.forEach(voucher => {
      all.push({
        id: voucher.id,
        date: voucher.date,
        type: voucher.type,
        narration: voucher.narration,
        debit: { account: voucher.debit_account || voucher.debitAccount, amount: Number(voucher.amount) },
        credit: { account: voucher.credit_account || voucher.creditAccount, amount: Number(voucher.amount) },
      });
    });
    return all.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [sales, expenses, vouchers, isAdmin]);

  // Ledgers
  const ledgers = useMemo(() => {
    if (!isAdmin) return {};
    const ledgerData = {};
    accounts.forEach(acc => {
      if (!ledgerData[acc.name]) {
        ledgerData[acc.name] = { transactions: [], balance: 0 };
      }
    });
    transactions.forEach(tx => {
      const { debit, credit } = tx;
      if (!ledgerData[debit.account]) ledgerData[debit.account] = { transactions: [], balance: 0 };
      ledgerData[debit.account].transactions.push({ ...tx, type: 'debit', amount: debit.amount });
      if (!ledgerData[credit.account]) ledgerData[credit.account] = { transactions: [], balance: 0 };
      ledgerData[credit.account].transactions.push({ ...tx, type: 'credit', amount: credit.amount });
    });
    for (const account in ledgerData) {
      let balance = 0;
      ledgerData[account].transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
      ledgerData[account].transactions.forEach(transaction => {
        if (transaction.debit.account === account) {
          balance += transaction.debit.amount;
        } else if (transaction.credit.account === account) {
          balance -= transaction.credit.amount;
        }
        transaction.balance = balance;
      });
      ledgerData[account].balance = balance;
    }
    return ledgerData;
  }, [transactions, accounts, isAdmin]);

  // Trial Balance
  const trialBalance = useMemo(() => {
    if (!isAdmin) return {};
    const trialAccounts = {};
    Object.entries(ledgers).forEach(([accountName, data]) => {
      const accountInfo = accounts.find(a => a.name === accountName);
      const accountType = accountInfo ? accountInfo.type : '';
      const isDebitNormal = ['Asset', 'Expense'].includes(accountType);
      if (data.balance > 0) {
        if (isDebitNormal) trialAccounts[accountName] = { debit: data.balance, credit: 0 };
        else trialAccounts[accountName] = { debit: 0, credit: data.balance };
      } else if (data.balance < 0) {
        if (isDebitNormal) trialAccounts[accountName] = { debit: 0, credit: -data.balance };
        else trialAccounts[accountName] = { debit: -data.balance, credit: 0 };
      }
    });
    return trialAccounts;
  }, [ledgers, accounts, isAdmin]);

  // Profit and Loss
  const profitAndLoss = useMemo(() => {
    if (!isAdmin) return { revenue: 0, cogs: 0, grossProfit: 0, operatingExpenses: 0, netProfit: 0 };
    const revenue = ledgers['Sales']?.balance || 0;
    const cogs = ledgers['Cost of Goods Sold']?.balance || 0;
    const grossProfit = revenue - cogs;
    const operatingExpenses = ledgers['Expenses']?.balance || 0;
    const netProfit = grossProfit - operatingExpenses;
    return { revenue, cogs, grossProfit, operatingExpenses, netProfit };
  }, [ledgers, isAdmin]);

  // Balance Sheet
  const balanceSheet = useMemo(() => {
    if (!isAdmin) return { assets: {}, liabilities: {}, equity: {} };
    const assets = {
      cashAndBank: ledgers['Cash/Bank']?.balance || 0,
      accountsReceivable: ledgers['Accounts Receivable']?.balance || 0,
      inventory: ledgers['Inventory']?.balance || 0,
    };
    assets.total = Object.values(assets).reduce((sum, val) => sum + val, 0);
    const liabilities = {
      accountsPayable: ledgers['Accounts Payable']?.balance || 0,
    };
    const equity = {
      retainedEarnings: profitAndLoss.netProfit,
    };
    liabilities.total = (liabilities.accountsPayable || 0) + equity.retainedEarnings;
    return { assets, liabilities, equity };
  }, [ledgers, profitAndLoss, isAdmin]);

  // Stock Valuation
  const stockValuation = useMemo(() => {
    if (!isAdmin) return [];
    return (inventory || []).map(item => ({
      ...item,
      value: (item.stock || 0) * (item.cost_price || item.costPrice || 0)
    }));
  }, [inventory, isAdmin]);

  const value = isAdmin ? {
    accounts,
    vouchers,
    sales,
    expenses,
    transactions,
    ledgers,
    trialBalance,
    profitAndLoss,
    balanceSheet,
    stockValuation,
    loadingAccounts,
    loadingVouchers,
    loadingSales,
    loadingExpenses,
    addAccount,
    updateAccount,
    deleteAccount,
    addVoucher,
    updateVoucher,
    deleteVoucher,
  } : {};

  return (
    <AccountingContext.Provider value={value}>
      {isAdmin ? children : null}
    </AccountingContext.Provider>
  );
}; 