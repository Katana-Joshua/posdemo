import React, { useState, useEffect } from 'react';
import { useAccounting } from '@/contexts/AccountingContext.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Scale, Loader2, RefreshCw } from 'lucide-react';

const TrialBalance = () => {
  const { fetchTrialBalance } = useAccounting();
  const [trialBalance, setTrialBalance] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadTrialBalance = async () => {
    setLoading(true);
    try {
      const data = await fetchTrialBalance();
      setTrialBalance(data);
    } catch (error) {
      console.error('Error loading trial balance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrialBalance();
  }, []);

  if (loading) {
    return (
      <Card className="glass-effect border-amber-800/50">
        <CardHeader>
          <CardTitle className="flex items-center text-amber-100">
            <Scale className="w-6 h-6 mr-2" />
            Trial Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 mr-2 animate-spin text-amber-400" />
            <span className="text-amber-100">Loading Trial Balance...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!trialBalance) {
    return (
      <Card className="glass-effect border-amber-800/50">
        <CardHeader>
          <CardTitle className="flex items-center text-amber-100">
            <Scale className="w-6 h-6 mr-2" />
            Trial Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8">
            <p className="text-amber-200 mb-4">No trial balance data available</p>
            <Button onClick={loadTrialBalance} className="bg-amber-600 hover:bg-amber-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { accounts, totals, balanced } = trialBalance;

  return (
    <Card className="glass-effect border-amber-800/50">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center text-amber-100">
            <Scale className="w-6 h-6 mr-2" />
            Trial Balance
          </CardTitle>
          <Button onClick={loadTrialBalance} className="bg-amber-600 hover:bg-amber-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-amber-200">Account Name</TableHead>
                <TableHead className="text-amber-200 text-right">Debit (UGX)</TableHead>
                <TableHead className="text-amber-200 text-right">Credit (UGX)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(accounts).map(([accountName, data]) => (
                <TableRow key={accountName}>
                  <TableCell className="font-medium text-amber-100">{accountName}</TableCell>
                  <TableCell className="text-right text-amber-100">
                    {data.debit > 0 ? data.debit.toLocaleString() : '-'}
                  </TableCell>
                  <TableCell className="text-right text-amber-100">
                    {data.credit > 0 ? data.credit.toLocaleString() : '-'}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2 border-amber-600">
                <TableCell className="font-bold text-amber-100">TOTAL</TableCell>
                <TableCell className="text-right font-bold text-amber-100">
                  {totals.debit.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-bold text-amber-100">
                  {totals.credit.toLocaleString()}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        
        <div className="mt-4 p-4 rounded-lg bg-black/20 border border-amber-800/50">
          <div className="flex items-center justify-between">
            <span className="text-amber-200">Status:</span>
            <span className={`font-semibold ${balanced ? 'text-green-400' : 'text-red-400'}`}>
              {balanced ? '✓ Balanced' : '✗ Not Balanced'}
            </span>
          </div>
          {!balanced && (
            <div className="mt-2 text-sm text-amber-300">
              Difference: UGX {Math.abs(totals.debit - totals.credit).toLocaleString()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrialBalance; 