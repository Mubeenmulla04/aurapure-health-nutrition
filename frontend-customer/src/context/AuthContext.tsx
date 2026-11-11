import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { name: string; email: string; phone?: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('aurapure_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      const currentUser = res.data.data.user;
      setUser(currentUser);
      localStorage.setItem('aurapure_user', JSON.stringify(currentUser));
    } catch {
      setUser(null);
      localStorage.removeItem('aurapure_user');
      localStorage.removeItem('aurapure_access_token');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('aurapure_access_token');
    if (token) {
      refreshProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await api.post('/auth/login', credentials);
    const { user: loggedInUser, accessToken } = res.data.data;
    localStorage.setItem('aurapure_access_token', accessToken);
    localStorage.setItem('aurapure_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  };

  const register = async (data: { name: string; email: string; phone?: string; password: string }) => {
    const res = await api.post('/auth/register', data);
    const { user: registeredUser, accessToken } = res.data.data;
    localStorage.setItem('aurapure_access_token', accessToken);
    localStorage.setItem('aurapure_user', JSON.stringify(registeredUser));
    setUser(registeredUser);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore
    } finally {
      localStorage.removeItem('aurapure_access_token');
      localStorage.removeItem('aurapure_user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
