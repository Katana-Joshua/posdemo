import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePOS } from '@/contexts/POSContext.jsx';
import { toast } from '@/components/ui/use-toast';
import { Calendar, Receipt, Search } from 'lucide-react';

const SalesReportFilter = ({ onFilter }) => {
  const { sales, expenses } = usePOS();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [startReceipt, setStartReceipt] = useState('');
  const [endReceipt, setEndReceipt] = useState('');

  const filterByDateTime = () => {
    if (!startDate || !endDate) {
      toast({
        title: 'Error',
        description: 'Please select both start and end dates',
        variant: 'destructive',
      });
      return;
    }

    const startDateTime = new Date(`${startDate}T${startTime || '00:00:00'}`);
    const endDateTime = new Date(`${endDate}T${endTime || '23:59:59'}`);

    if (startDateTime > endDateTime) {
      toast({
        title: 'Error',
        description: 'Start date and time cannot be after end date and time.',
        variant: 'destructive',
      });
      return;
    }

    const filteredS = sales.filter(sale => {
      const saleDate = new Date(sale.timestamp);
      return saleDate >= startDateTime && saleDate <= endDateTime;
    });

    const filteredE = expenses.filter(expense => {
      const expenseDate = new Date(expense.timestamp);
      return expenseDate >= startDateTime && expenseDate <= endDateTime;
    });

    onFilter({ sales: filteredS, expenses: filteredE });

    toast({
      title: 'Filter Applied',
      description: `Found ${filteredS.length} sales and ${filteredE.length} expenses`,
    });
  };

  const filterByReceipt = () => {
    if (!startReceipt || !endReceipt) {
      toast({
        title: 'Error',
        description: 'Please enter both start and end receipt numbers',
        variant: 'destructive',
      });
      return;
    }

    const filtered = sales.filter(sale => {
      const receiptNum = parseInt(sale.receiptNumber.replace(/\D/g, ''));
      const start = parseInt(startReceipt.replace(/\D/g, ''));
      const end = parseInt(endReceipt.replace(/\D/g, ''));
      return receiptNum >= start && receiptNum <= end;
    });

    onFilter({ sales: filtered, expenses: [] }); // Receipt filter doesn't apply to expenses

    toast({
      title: 'Filter Applied',
      description: `Found ${filtered.length} sales records`,
    });
  };
  
  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setStartTime('');
    setEndTime('');
    setStartReceipt('');
    setEndReceipt('');
    onFilter({ sales, expenses });
  };


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-effect border-amber-800/50">
          <CardHeader>
            <CardTitle className="flex items-center text-amber-100">
              <Calendar className="w-5 h-5 mr-2" />
              Filter by Date & Time
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-amber-200">Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-black/20 border-amber-800/50 text-amber-100"
                />
              </div>
              <div>
                <Label className="text-amber-200">End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-black/20 border-amber-800/50 text-amber-100"
                />
              </div>
              <div>
                <Label className="text-amber-200">Start Time</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-black/20 border-amber-800/50 text-amber-100"
                />
              </div>
              <div>
                <Label className="text-amber-200">End Time</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="bg-black/20 border-amber-800/50 text-amber-100"
                />
              </div>
            </div>
            <Button onClick={filterByDateTime} className="w-full bg-amber-600 hover:bg-amber-700">
              <Search className="w-4 h-4 mr-2" />
              Filter by Date & Time
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-effect border-amber-800/50">
          <CardHeader>
            <CardTitle className="flex items-center text-amber-100">
              <Receipt className="w-5 h-5 mr-2" />
              Filter by Receipt Range
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-amber-200">Start Receipt #</Label>
                <Input
                  placeholder="RCP123456"
                  value={startReceipt}
                  onChange={(e) => setStartReceipt(e.target.value)}
                  className="bg-black/20 border-amber-800/50 text-amber-100"
                />
              </div>
              <div>
                <Label className="text-amber-200">End Receipt #</Label>
                <Input
                  placeholder="RCP789012"
                  value={endReceipt}
                  onChange={(e) => setEndReceipt(e.target.value)}
                  className="bg-black/20 border-amber-800/50 text-amber-100"
                />
              </div>
            </div>
            <Button onClick={filterByReceipt} className="w-full bg-amber-600 hover:bg-amber-700">
              <Search className="w-4 h-4 mr-2" />
              Filter by Receipt
            </Button>
          </CardContent>
        </Card>
      </div>
      <Button onClick={clearFilters} variant="outline" className="border-amber-800/50 text-amber-100">
          Clear Filters
      </Button>
    </div>
  );
};

export default SalesReportFilter;
