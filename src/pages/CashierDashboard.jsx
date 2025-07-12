
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { usePOS } from '@/contexts/POSContext';
import { LogOut, ShoppingCart, Clock, DollarSign, TrendingDown, Loader2 } from 'lucide-react';
import MenuGrid from '@/components/cashier/MenuGrid';
import Cart from '@/components/cashier/Cart';
import ShiftManager from '@/components/cashier/ShiftManager';
import PaymentModal from '@/components/cashier/PaymentModal';
import ExpenseModal from '@/components/cashier/ExpenseModal';

const CashierDashboard = () => {
  const { user, signOut } = useAuth();
  const { currentShift, cart, sales, loading } = usePOS();
  const navigate = useNavigate();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!currentShift) {
    return <ShiftManager />;
  }

  const shiftSales = sales.filter(sale => 
    new Date(sale.created_at) >= new Date(currentShift.startTime)
  );
  const shiftRevenue = shiftSales.reduce((sum, sale) => sum + Number(sale.total), 0);
  const cartTotal = cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);

  // Utility to strip leading zeros
  const stripLeadingZeros = num => {
    if (typeof num === 'number') return num;
    if (typeof num === 'string') return num.replace(/^0+(?!$)/, '');
    return num;
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-6"
        >
          <div>
            <h1 className="text-3xl font-bold text-amber-100">Moon Land Terminal</h1>
            <p className="text-amber-200/80">Welcome, {currentShift.cashierName}</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setIsExpenseModalOpen(true)}
              variant="outline"
              className="border-red-800/50 text-red-100 hover:bg-red-950/50"
            >
              <TrendingDown className="w-4 h-4 mr-2" />
              Record Expense
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-amber-800/50 text-amber-100 hover:bg-amber-950/50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full px-2 mb-6"
        >
          <div className="glass-effect p-4 rounded-lg">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-amber-500 mr-2" />
              <div>
                <p className="text-sm text-amber-200/80">Shift Started</p>
                <p className="font-semibold text-amber-100">
                  {new Date(currentShift.startTime).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="glass-effect p-4 rounded-lg">
            <div className="flex items-center">
              <DollarSign className="w-5 h-5 text-green-500 mr-2" />
              <div>
                <p className="text-sm text-amber-200/80">Orders Today</p>
                <p className="font-semibold text-amber-100">{shiftSales.length}</p>
              </div>
            </div>
          </div>

          <div className="glass-effect p-4 rounded-lg">
            <div className="flex items-center">
              <ShoppingCart className="w-5 h-5 text-amber-500 mr-2" />
              <div>
                <p className="text-sm text-amber-200/80">Current Cart</p>
                <p className="font-semibold text-amber-100">UGX {stripLeadingZeros(cartTotal).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full px-2">
          {/* Menu Grid */}
          <div className="lg:col-span-2">
            <MenuGrid />
          </div>

          {/* Cart */}
          <div>
            <Cart onCheckout={() => setIsPaymentModalOpen(true)} />
          </div>
        </div>

        {/* Payment Modal */}
        <PaymentModal 
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
        />

        {/* Expense Modal */}
        <ExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default CashierDashboard;
