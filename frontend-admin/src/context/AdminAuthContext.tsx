import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';

export const STAFF_ROLES = [
  'super_admin',
  'admin',
  'order_manager',
  'product_manager',
  'inventory_manager',
  'support_manager',
  'marketing_manager',
];

interface AdminUser {
  id: string;
  name?: string;
  fullName?: string;
  mobileNumber: string;
  email?: string;
  role: string;
}

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sendOtp: (mobileNumber: string) => Promise<{ cooldownSeconds?: number }>;
  verifyOtp: (mobileNumber: string, otp: string) => Promise<void>;
  resendOtp: (mobileNumber: string) => Promise<void>;
  logout: () => void;
  hasRole: (roles: string[]) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem('aurapure_admin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('aurapure_admin_token');
    if (token) {
      adminApi
        .get('/auth/me')
        .then((res) => {
          const user = res.data.data.user;
          if (STAFF_ROLES.includes(user.role)) {
            setAdminUser(user);
            localStorage.setItem('aurapure_admin_user', JSON.stringify(user));
          } else {
            logout();
          }
        })
        .catch(() => logout())
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const sendOtp = async (mobileNumber: string) => {
    const res = await adminApi.post('/auth/send-otp', { mobileNumber });
    return res.data.data;
  };

  const verifyOtp = async (mobileNumber: string, otp: string) => {
    const res = await adminApi.post('/auth/verify-otp', { mobileNumber, otp });
    const { user, accessToken } = res.data.data;

    if (!STAFF_ROLES.includes(user.role)) {
      throw new Error(
        'Access Denied: This mobile number does not possess administrative staff credentials. Please contact a Super Administrator.'
      );
    }

    localStorage.setItem('aurapure_admin_token', accessToken);
    localStorage.setItem('aurapure_admin_user', JSON.stringify(user));
    setAdminUser(user);
  };

  const resendOtp = async (mobileNumber: string) => {
    await adminApi.post('/auth/resend-otp', { mobileNumber });
  };

  const logout = () => {
    try {
      adminApi.post('/auth/logout').catch(() => {});
    } catch {
      // Ignore
    } finally {
      localStorage.removeItem('aurapure_admin_token');
      localStorage.removeItem('aurapure_admin_user');
      setAdminUser(null);
    }
  };

  const hasRole = (roles: string[]) => {
    if (!adminUser) return false;
    if (adminUser.role === 'super_admin') return true;
    return roles.includes(adminUser.role);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        isAuthenticated: !!adminUser,
        isLoading,
        sendOtp,
        verifyOtp,
        resendOtp,
        logout,
        hasRole,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  return context;
};
