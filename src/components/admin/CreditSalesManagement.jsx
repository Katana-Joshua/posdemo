import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePOS } from '@/contexts/POSContext';
import { BookUser, CheckCircle } from 'lucide-react';

// Utility to strip leading zeros
const stripLeadingZeros = num => {
  if (typeof num === 'number') return num;
  if (typeof num === 'string') return num.replace(/^0+(?!$)/, '');
  return num;
};

const CreditSalesManagement = () => {
  const { sales, payCreditSale } = usePOS();

  const unpaidSales = sales.filter(sale => sale.status === 'unpaid');
  const totalCredit = unpaidSales.reduce((sum, sale) => sum + sale.total, 0);

  return (
    <div className="space-y-6">
      <Card className="glass-effect border-yellow-800/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-bold text-yellow-100">Outstanding Credit</CardTitle>
          <BookUser className="h-6 w-6 text-yellow-400" />
        </CardHeader>
        <CardContent>
            <p className="text-sm text-yellow-200/80">Total amount owed by customers</p>
            <p className="text-3xl font-bold text-yellow-400">UGX {stripLeadingZeros(totalCredit).toLocaleString()}</p>
        </CardContent>
      </Card>

      <Card className="glass-effect border-amber-800/50">
        <CardHeader>
          <CardTitle className="text-amber-100">
            Unpaid Sales ({unpaidSales.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[30rem] overflow-y-auto">
            {unpaidSales.length === 0 ? (
              <p className="text-amber-200/60 text-center py-8">No outstanding credit sales.</p>
            ) : (
              unpaidSales.map((sale, index) => (
                <motion.div
                  key={sale.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 bg-black/20 rounded-lg border border-yellow-800/30"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-yellow-100">
                        {sale.customerInfo?.name || 'Unknown Customer'}
                      </p>
                      <p className="text-sm text-yellow-200/80">
                        {sale.customerInfo?.contact}
                      </p>
                      <p className="text-xs text-amber-200/60 mt-1">
                        {new Date(sale.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-yellow-200 text-lg">UGX {sale.total.toLocaleString()}</p>
                        <Button 
                            size="sm" 
                            className="mt-2 bg-green-600 hover:bg-green-700"
                            onClick={() => payCreditSale(sale.id)}
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark as Paid
                        </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreditSalesManagement;