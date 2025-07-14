import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '@/lib/api.js';
import { toast } from '@/components/ui/use-toast';

const AccountingContext = createContext();

export const useAccounting = () => {
  const context = useContext(AccountingContext);
  if (!context) {
    throw new Error('useAccounting must be used within an AccountingProvider');
  }
  return context;
};

export const AccountingProvider = ({ children }) => {
  const [accounts, setAccounts] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [ledgers, setLedgers] = useState({});
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingVouchers, setLoadingVouchers] = useState(true);
  const [loadingLedgers, setLoadingLedgers] = useState(false);

  // Load accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      setLoadingAccounts(true);
      try {
        const data = await apiClient.getAccounts();
        setAccounts(data || []);
      } catch (error) {
        toast({ 
          title: 'Error fetching accounts', 
          description: error.message, 
          variant: 'destructive' 
        });
      } finally {
        setLoadingAccounts(false);
      }
    };
    fetchAccounts();
  }, []);

  // Load vouchers
  useEffect(() => {
    const fetchVouchers = async () => {
      setLoadingVouchers(true);
      try {
        const data = await apiClient.getVouchers();
        setVouchers(data || []);
      } catch (error) {
        toast({ 
          title: 'Error fetching vouchers', 
          description: error.message, 
          variant: 'destructive' 
        });
      } finally {
        setLoadingVouchers(false);
      }
    };
    fetchVouchers();
  }, []);

  const addAccount = async (account) => {
    try {
      const newAccount = await apiClient.addAccount(account);
      setAccounts(prev => [...prev, newAccount]);
      toast({ 
        title: 'Account Created', 
        description: `Account "${newAccount.name}" has been successfully created.` 
      });
      return newAccount;
    } catch (error) {
      toast({ 
        title: 'Error adding account', 
        description: error.message, 
        variant: 'destructive' 
      });
      return null;
    }
  };

  const updateAccount = async (id, account) => {
    try {
      const updatedAccount = await apiClient.updateAccount(id, account);
      setAccounts(prev => prev.map(acc => acc.id === id ? updatedAccount : acc));
      toast({ 
        title: 'Account Updated', 
        description: `Account "${updatedAccount.name}" has been successfully updated.` 
      });
      return updatedAccount;
    } catch (error) {
      toast({ 
        title: 'Error updating account', 
        description: error.message, 
        variant: 'destructive' 
      });
      return null;
    }
  };

  const deleteAccount = async (id) => {
    try {
      await apiClient.deleteAccount(id);
      setAccounts(prev => prev.filter(acc => acc.id !== id));
      toast({ 
        title: 'Account Deleted', 
        description: 'Account has been successfully deleted.' 
      });
      return true;
    } catch (error) {
      toast({ 
        title: 'Error deleting account', 
        description: error.message, 
        variant: 'destructive' 
      });
      return false;
    }
  };

  const addVoucher = async (voucher) => {
    try {
      const newVoucher = await apiClient.addVoucher(voucher);
      setVouchers(prev => [...prev, newVoucher]);
      toast({ 
        title: "Voucher Created", 
        description: `Voucher ${newVoucher.type} for UGX ${newVoucher.amount} has been recorded.` 
      });
      return newVoucher;
    } catch (error) {
      toast({ 
        title: 'Error adding voucher', 
        description: error.message, 
        variant: 'destructive' 
      });
      return null;
    }
  };

  const updateVoucher = async (id, voucher) => {
    try {
      const updatedVoucher = await apiClient.updateVoucher(id, voucher);
      setVouchers(prev => prev.map(v => v.id === id ? updatedVoucher : v));
      toast({ 
        title: 'Voucher Updated', 
        description: `Voucher has been successfully updated.` 
      });
      return updatedVoucher;
    } catch (error) {
      toast({ 
        title: 'Error updating voucher', 
        description: error.message, 
        variant: 'destructive' 
      });
      return null;
    }
  };

  const deleteVoucher = async (id) => {
    try {
      await apiClient.deleteVoucher(id);
      setVouchers(prev => prev.filter(v => v.id !== id));
      toast({ 
        title: 'Voucher Deleted', 
        description: 'Voucher has been successfully deleted.' 
      });
      return true;
    } catch (error) {
      toast({ 
        title: 'Error deleting voucher', 
        description: error.message, 
        variant: 'destructive' 
      });
      return false;
    }
  };

  const fetchLedgers = async () => {
    setLoadingLedgers(true);
    try {
      const data = await apiClient.getLedgers();
      setLedgers(data || {});
    } catch (error) {
      toast({ 
        title: 'Error fetching ledgers', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setLoadingLedgers(false);
    }
  };

  const fetchTrialBalance = async () => {
    try {
      return await apiClient.getTrialBalance();
    } catch (error) {
      toast({ 
        title: 'Error fetching trial balance', 
        description: error.message, 
        variant: 'destructive' 
      });
      return null;
    }
  };

  const fetchProfitAndLoss = async () => {
    try {
      return await apiClient.getProfitAndLoss();
    } catch (error) {
      toast({ 
        title: 'Error fetching profit & loss', 
        description: error.message, 
        variant: 'destructive' 
      });
      return null;
    }
  };

  const fetchBalanceSheet = async () => {
    try {
      return await apiClient.getBalanceSheet();
    } catch (error) {
      toast({ 
        title: 'Error fetching balance sheet', 
        description: error.message, 
        variant: 'destructive' 
      });
      return null;
    }
  };

  const value = {
    accounts,
    vouchers,
    ledgers,
    loadingAccounts,
    loadingVouchers,
    loadingLedgers,
    addAccount,
    updateAccount,
    deleteAccount,
    addVoucher,
    updateVoucher,
    deleteVoucher,
    fetchLedgers,
    fetchTrialBalance,
    fetchProfitAndLoss,
    fetchBalanceSheet,
  };

  return (
    <AccountingContext.Provider value={value}>
      {children}
    </AccountingContext.Provider>
  );
}; 