import React, { useState } from 'react';
import { useAccounting } from '@/contexts/AccountingContext.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Library, PlusCircle, Loader2, Edit, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const ChartOfAccounts = () => {
  const { accounts, addAccount, updateAccount, deleteAccount, loadingAccounts } = useAccounting();
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [formData, setFormData] = useState({ name: '', type: '', description: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.type) {
      toast({ title: "Validation Error", description: "Account name and type are required.", variant: "destructive" });
      return;
    }
    
    if (editMode && selectedAccount) {
      const updated = await updateAccount(selectedAccount.id, formData);
      if (updated) {
        setFormData({ name: '', type: '', description: '' });
        setEditMode(false);
        setSelectedAccount(null);
        setOpen(false);
      }
    } else {
      const created = await addAccount(formData);
      if (created) {
        setFormData({ name: '', type: '', description: '' });
        setOpen(false);
      }
    }
  };

  const handleEdit = (account) => {
    setSelectedAccount(account);
    setFormData({ name: account.name, type: account.type, description: account.description || '' });
    setEditMode(true);
    setOpen(true);
  };

  const handleDelete = async (account) => {
    if (confirm(`Are you sure you want to delete account "${account.name}"?`)) {
      await deleteAccount(account.id);
    }
  };

  const accountTypes = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];

  return (
    <Card className="glass-effect border-amber-800/50">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center text-amber-100">
              <Library className="w-6 h-6 mr-2" />
              Chart of Accounts
            </CardTitle>
            <CardDescription className="text-amber-200/60">Manage your financial accounts here.</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
              setEditMode(false);
              setSelectedAccount(null);
              setFormData({ name: '', type: '', description: '' });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700">
                <PlusCircle className="w-4 h-4 mr-2"/>
                New Account
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-stone-900 border-amber-800/50 text-amber-100">
              <DialogHeader>
                <DialogTitle>{editMode ? 'Edit Account' : 'Create New Account'}</DialogTitle>
                <DialogDescription className="text-amber-200/70">
                  {editMode ? 'Update the account details.' : 'Add a new ledger account to your chart of accounts.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input 
                      id="name" 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      className="col-span-3 bg-black/20 border-amber-800/50 text-amber-100" 
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right">Type</Label>
                    <Select value={formData.type} onValueChange={value => setFormData({...formData, type: value})}>
                      <SelectTrigger className="col-span-3 bg-black/20 border-amber-800/50 text-amber-100">
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                      <SelectContent>
                        {accountTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">Description</Label>
                    <Input 
                      id="description" 
                      value={formData.description} 
                      onChange={e => setFormData({...formData, description: e.target.value})} 
                      className="col-span-3 bg-black/20 border-amber-800/50 text-amber-100" 
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
                    {editMode ? 'Update Account' : 'Save Account'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loadingAccounts ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 mr-2 animate-spin text-amber-400" />
            <span className="text-amber-100">Loading Accounts...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-amber-200">Account Name</TableHead>
                  <TableHead className="text-amber-200">Type</TableHead>
                  <TableHead className="text-amber-200">Description</TableHead>
                  <TableHead className="text-amber-200">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...accounts].sort((a,b) => a.name.localeCompare(b.name)).map(account => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium text-amber-100">{account.name}</TableCell>
                    <TableCell className="text-amber-100">{account.type}</TableCell>
                    <TableCell className="text-amber-100">{account.description}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(account)}
                          className="h-8 w-8 p-0 border-amber-600 text-amber-400 hover:bg-amber-600 hover:text-white"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(account)}
                          className="h-8 w-8 p-0 border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChartOfAccounts; 