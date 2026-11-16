import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { ToastProvider } from './components/common/Toast';
import { AdminLayout } from './components/layout/AdminLayout';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProductsPage } from './pages/ProductsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { InventoryPage } from './pages/InventoryPage';
import { CouponsPage } from './pages/CouponsPage';
import { CustomersPage } from './pages/CustomersPage';
import { StaffPage } from './pages/StaffPage';
import { StoreSettingsPage } from './pages/StoreSettingsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { RefundsPage } from './pages/RefundsPage';
import { ShipmentsPage } from './pages/ShipmentsPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { BannersPage } from './pages/BannersPage';
import { SlideshowPage } from './pages/SlideshowPage';
import { FaqsPage } from './pages/FaqsPage';
import { ReportsPage } from './pages/ReportsPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ContentPagesPage } from './pages/ContentPagesPage';

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
        <ToastProvider>
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
            path="/reports"
            element={
              <ProtectedAdminRoute>
                <ReportsPage />
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
            path="/invoices"
            element={
              <ProtectedAdminRoute>
                <InvoicesPage />
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
            path="/categories"
            element={
              <ProtectedAdminRoute>
                <CategoriesPage />
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

          <Route
            path="/marketing"
            element={<Navigate to="/coupons" replace />}
          />

          <Route
            path="/content"
            element={<Navigate to="/content/slides" replace />}
          />

          <Route
            path="/settings"
            element={<Navigate to="/settings/store" replace />}
          />

          <Route
            path="/customers"
            element={
              <ProtectedAdminRoute>
                <CustomersPage />
              </ProtectedAdminRoute>
            }
          />

          <Route
            path="/shipments"
            element={
              <ProtectedAdminRoute>
                <ShipmentsPage />
              </ProtectedAdminRoute>
            }
          />

          <Route
            path="/payments"
            element={
              <ProtectedAdminRoute>
                <PaymentsPage />
              </ProtectedAdminRoute>
            }
          />

          <Route
            path="/refunds"
            element={
              <ProtectedAdminRoute>
                <RefundsPage />
              </ProtectedAdminRoute>
            }
          />

          <Route
            path="/reviews"
            element={
              <ProtectedAdminRoute>
                <ReviewsPage />
              </ProtectedAdminRoute>
            }
          />

          <Route
            path="/content/slides"
            element={
              <ProtectedAdminRoute>
                <SlideshowPage />
              </ProtectedAdminRoute>
            }
          />

          <Route
            path="/content/banners"
            element={
              <ProtectedAdminRoute>
                <BannersPage />
              </ProtectedAdminRoute>
            }
          />

          <Route
            path="/content/faqs"
            element={
              <ProtectedAdminRoute>
                <FaqsPage />
              </ProtectedAdminRoute>
            }
          />

          <Route
            path="/content/pages"
            element={
              <ProtectedAdminRoute>
                <ContentPagesPage />
              </ProtectedAdminRoute>
            }
          />

          <Route
            path="/settings/staff"
            element={
              <ProtectedAdminRoute>
                <StaffPage />
              </ProtectedAdminRoute>
            }
          />

          <Route
            path="/settings/store"
            element={
              <ProtectedAdminRoute>
                <StoreSettingsPage />
              </ProtectedAdminRoute>
            }
          />

          <Route
            path="/settings/audit-logs"
            element={
              <ProtectedAdminRoute>
                <AuditLogsPage />
              </ProtectedAdminRoute>
            }
          />

          <Route
            path="/settings/notifications"
            element={
              <ProtectedAdminRoute>
                <NotificationsPage />
              </ProtectedAdminRoute>
            }
          />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </AdminAuthProvider>
    </BrowserRouter>
  );
};

export default App;
