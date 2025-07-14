import React, { useState } from 'react';
import { useAccounting } from '@/contexts/AccountingContext.jsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const VoucherEntry = () => {
  const { addVoucher, accounts } = useAccounting();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState('Payment');
  const [amount, setAmount] = useState('');
  const [debitAccount, setDebitAccount] = useState('');
  const [creditAccount, setCreditAccount] = useState('');
  const [narration, setNarration] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!type || !amount || !debitAccount || !creditAccount || !narration || !date) {
      toast({ title: "Validation Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    if (debitAccount === creditAccount) {
      toast({ title: "Validation Error", description: "Debit and credit accounts must be different", variant: "destructive" });
      return;
    }

    if (parseFloat(amount) <= 0) {
      toast({ title: "Validation Error", description: "Amount must be greater than zero", variant: "destructive" });
      return;
    }

    const voucher = {
      date,
      type,
      amount: parseFloat(amount),
      debit_account: debitAccount,
      credit_account: creditAccount,
      narration,
    };

    const created = await addVoucher(voucher);
    if (created) {
      // Reset form
      setDate(new Date().toISOString().split('T')[0]);
      setType('Payment');
      setAmount('');
      setDebitAccount('');
      setCreditAccount('');
      setNarration('');
    }
  };

  const accountOptions = accounts.map(acc => (
    <SelectItem key={acc.id} value={acc.name}>{acc.name}</SelectItem>
  ));

  return (
    <Card className="glass-effect border-amber-800/50">
      <CardHeader>
        <CardTitle className="flex items-center text-amber-100">
          <PlusCircle className="w-6 h-6 mr-2" />
          New Voucher Entry
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date" className="text-amber-200">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-black/20 border-amber-800/50 text-amber-100"
              />
            </div>
            <div>
              <Label htmlFor="type" className="text-amber-200">Voucher Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type" className="bg-black/20 border-amber-800/50 text-amber-100">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Payment">Payment</SelectItem>
                  <SelectItem value="Receipt">Receipt</SelectItem>
                  <SelectItem value="Journal">Journal</SelectItem>
                  <SelectItem value="Contra">Contra</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="debitAccount" className="text-amber-200">Debit Account</Label>
              <Select value={debitAccount} onValueChange={setDebitAccount}>
                <SelectTrigger id="debitAccount" className="bg-black/20 border-amber-800/50 text-amber-100">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>{accountOptions}</SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="creditAccount" className="text-amber-200">Credit Account</Label>
              <Select value={creditAccount} onValueChange={setCreditAccount}>
                <SelectTrigger id="creditAccount" className="bg-black/20 border-amber-800/50 text-amber-100">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>{accountOptions}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="amount" className="text-amber-200">Amount (UGX)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-black/20 border-amber-800/50 text-amber-100"
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>
          <div>
            <Label htmlFor="narration" className="text-amber-200">Narration</Label>
            <Textarea
              id="narration"
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              className="bg-black/20 border-amber-800/50 text-amber-100"
              placeholder="Describe the transaction..."
              rows={3}
            />
          </div>
          <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700">
            Create Voucher
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default VoucherEntry; 