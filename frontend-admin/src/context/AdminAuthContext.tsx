import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
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
          if (user.role === 'admin' || user.role === 'inventory_manager') {
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

  const login = async (credentials: { email: string; password: string }) => {
    const res = await adminApi.post('/auth/login', credentials);
    const { user, accessToken } = res.data.data;
    if (user.role !== 'admin' && user.role !== 'inventory_manager') {
      throw new Error('Access denied. Administrator privileges required.');
    }
    localStorage.setItem('aurapure_admin_token', accessToken);
    localStorage.setItem('aurapure_admin_user', JSON.stringify(user));
    setAdminUser(user);
  };

  const logout = () => {
    localStorage.removeItem('aurapure_admin_token');
    localStorage.removeItem('aurapure_admin_user');
    setAdminUser(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        isAuthenticated: !!adminUser,
        isLoading,
        login,
        logout,
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
