import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster';
import LoginPage from '@/pages/LoginPage.jsx';
import AdminDashboard from '@/pages/AdminDashboard.jsx';
import CashierDashboard from '@/pages/CashierDashboard.jsx';
import { AuthProvider } from '@/contexts/AuthContext.jsx';
import { POSProvider } from '@/contexts/POSContext.jsx';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';

function App() {
  return (
    <Router>
      <AuthProvider>
        <POSProvider>
          <Helmet>
              <title>Moon Land - Point of Sale System</title>
              <meta name="description" content="Modern point of sale system for bars and restaurants, featuring admin and cashier dashboards, inventory management, and sales reporting." />
          </Helmet>
          <div className="min-h-screen bar-gradient">
              <Routes>
                  <Route path="/" element={<LoginPage />} />
                  <Route 
                    path="/admin" 
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                          <AdminDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/cashier" 
                    element={
                      <ProtectedRoute allowedRoles={['cashier', 'admin']}>
                          <CashierDashboard />
                      </ProtectedRoute>
                    } 
                  />
              </Routes>
              <Toaster />
          </div>
        </POSProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
