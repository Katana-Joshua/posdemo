
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { usePOS } from '@/contexts/POSContext.jsx';
import { LogOut, BarChart3, Package, FileText, AlertTriangle, Users, TrendingDown, BookUser, Loader2, Calculator, Scale, Receipt, BookOpen } from 'lucide-react';
import SalesReports from '@/components/admin/SalesReports.jsx';
import InventoryManagement from '@/components/admin/InventoryManagement.jsx';
import StaffLogs from '@/components/admin/StaffLogs.jsx';
import LowStockAlerts from '@/components/admin/LowStockAlerts.jsx';
import StaffManagement from '@/components/admin/StaffManagement.jsx';
import ExpenseTracking from '@/components/admin/ExpenseTracking.jsx';
import CreditSalesManagement from '@/components/admin/CreditSalesManagement.jsx';
import AccountingDashboard from '@/components/admin/accounting/AccountingDashboard';
import ShiftLog from '@/components/admin/ShiftLog.jsx';

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const { sales, inventory, getLowStockItems, loading } = usePOS();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('reports');
  const tabsListRef = useRef(null);

  useEffect(() => {
    if (tabsListRef.current) {
      tabsListRef.current.scrollLeft = 0;
    }
  }, [activeTab]);

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

  const lowStockItems = getLowStockItems();
  const todaySales = sales.filter(sale => {
    const today = new Date().toDateString();
    return new Date(sale.created_at).toDateString() === today;
  });
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);

  // Utility to strip leading zeros
  const stripLeadingZeros = num => {
    if (typeof num === 'number') return num;
    if (typeof num === 'string') return num.replace(/^0+(?!$)/, '');
    return num;
  };

  return (
    <div className="min-h-screen p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-amber-100">Moonland - Admin</h1>
            <p className="text-amber-200/80">Welcome back, {user?.name || user?.email}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-amber-800/50 text-amber-100 hover:bg-amber-950/50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full px-2 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="glass-effect p-6 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-200/80 text-sm">Today's Revenue</p>
                <p className="text-2xl font-bold text-amber-100">UGX {stripLeadingZeros(todayRevenue).toLocaleString()}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-amber-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-effect p-6 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-200/80 text-sm">Today's Orders</p>
                <p className="text-2xl font-bold text-amber-100">{todaySales.length}</p>
              </div>
              <FileText className="w-8 h-8 text-amber-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-effect p-6 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-200/80 text-sm">Inventory Items</p>
                <p className="text-2xl font-bold text-amber-100">{inventory.length}</p>
              </div>
              <Package className="w-8 h-8 text-amber-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="glass-effect p-6 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-200/80 text-sm">Low Stock Alerts</p>
                <p className="text-2xl font-bold text-red-400">{lowStockItems.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </motion.div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="pb-2">
            <TabsList className="bg-transparent p-0 grid grid-cols-4 grid-rows-2 gap-2 w-full">
              {/* First row of nav items */}
              <TabsTrigger value="reports" className="data-[state=active]:bg-amber-600/80 data-[state=active]:text-white text-amber-200 bg-black/20 border border-amber-800/50 hover:bg-amber-900/40 transition-all">
                <FileText className="w-4 h-4 mr-2" /> Reports
              </TabsTrigger>
              <TabsTrigger value="inventory" className="data-[state=active]:bg-amber-600/80 data-[state=active]:text-white text-amber-200 bg-black/20 border border-amber-800/50 hover:bg-amber-900/40 transition-all">
                <Package className="w-4 h-4 mr-2" /> Inventory
              </TabsTrigger>
              <TabsTrigger value="credit_sales" className="data-[state=active]:bg-amber-600/80 data-[state=active]:text-white text-amber-200 bg-black/20 border border-amber-800/50 hover:bg-amber-900/40 transition-all">
                <BookUser className="w-4 h-4 mr-2" /> Credit Sales
              </TabsTrigger>
              <TabsTrigger value="expenses" className="data-[state=active]:bg-amber-600/80 data-[state=active]:text-white text-amber-200 bg-black/20 border border-amber-800/50 hover:bg-amber-900/40 transition-all">
                <TrendingDown className="w-4 h-4 mr-2" /> Expenses
              </TabsTrigger>
              {/* Second row of nav items (duplicate) */}
              <TabsTrigger value="accounting" className="data-[state=active]:bg-amber-600/80 data-[state=active]:text-white text-amber-200 bg-black/20 border border-amber-800/50 hover:bg-amber-900/40 transition-all">
                <BookOpen className="w-4 h-4 mr-2" /> Accounting
              </TabsTrigger>
              <TabsTrigger value="staff_management" className="data-[state=active]:bg-amber-600/80 data-[state=active]:text-white text-amber-200 bg-black/20 border border-amber-800/50 hover:bg-amber-900/40 transition-all">
                <Users className="w-4 h-4 mr-2" /> Staff
              </TabsTrigger>
              <TabsTrigger value="shift_logs" className="data-[state=active]:bg-amber-600/80 data-[state=active]:text-white text-amber-200 bg-black/20 border border-amber-800/50 hover:bg-amber-900/40 transition-all">
                <BarChart3 className="w-4 h-4 mr-2" /> Shift Logs
              </TabsTrigger>
              <TabsTrigger value="alerts" className="data-[state=active]:bg-amber-600/80 data-[state=active]:text-white text-amber-200 bg-black/20 border border-amber-800/50 hover:bg-amber-900/40 transition-all">
                <AlertTriangle className="w-4 h-4 mr-2" /> Alerts
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="h-30 sm:h-0 bg-transparent" />
          <div className="sm:mt-0">
            <TabsContent value="reports">
              <SalesReports />
            </TabsContent>
            <TabsContent value="inventory">
              <InventoryManagement />
            </TabsContent>
            <TabsContent value="credit_sales">
              <CreditSalesManagement />
            </TabsContent>
            <TabsContent value="expenses">
              <ExpenseTracking />
            </TabsContent>
            <TabsContent value="accounting">
              <AccountingDashboard />
            </TabsContent>
            <TabsContent value="staff_management">
              <StaffManagement />
            </TabsContent>
            <TabsContent value="shift_logs">
              <ShiftLog />
            </TabsContent>
            <TabsContent value="alerts">
              <LowStockAlerts />
            </TabsContent>
          </div>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
