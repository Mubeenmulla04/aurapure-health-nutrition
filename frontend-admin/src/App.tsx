import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { AdminLayout } from './components/layout/AdminLayout';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProductsPage } from './pages/ProductsPage';
import { InventoryPage } from './pages/InventoryPage';
import { CouponsPage } from './pages/CouponsPage';

const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-400 text-xs">
        Verifying administrator session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AdminLayout>{children}</AdminLayout>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <Routes>
          <Route path="/login" element={<AdminLoginPage />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedAdminRoute>
                <DashboardPage />
              </ProtectedAdminRoute>
            }
          />

          <Route
            path="/orders"
            element={
              <ProtectedAdminRoute>
                <OrdersPage />
              </ProtectedAdminRoute>
            }
          />

          <Route
            path="/products"
            element={
              <ProtectedAdminRoute>
                <ProductsPage />
              </ProtectedAdminRoute>
            }
          />

          <Route
            path="/inventory"
            element={
              <ProtectedAdminRoute>
                <InventoryPage />
              </ProtectedAdminRoute>
            }
          />

          <Route
            path="/coupons"
            element={
              <ProtectedAdminRoute>
                <CouponsPage />
              </ProtectedAdminRoute>
            }
          />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AdminAuthProvider>
    </BrowserRouter>
  );
};

export default App;
