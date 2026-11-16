import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sendOtp: (mobileNumber: string) => Promise<{ success: boolean; message: string; cooldownSeconds?: number }>;
  verifyOtp: (mobileNumber: string, otp: string) => Promise<{ isNewUser?: boolean }>;
  resendOtp: (mobileNumber: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: { name?: string; fullName?: string; email?: string }) => Promise<void>;
  changeMobileSendOtp: () => Promise<any>;
  changeMobileVerifyOld: (otp: string) => Promise<{ changeToken: string }>;
  changeMobileSendNewOtp: (newMobile: string) => Promise<any>;
  changeMobileVerifyNew: (newMobile: string, otp: string, changeToken: string) => Promise<any>;
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

  const sendOtp = async (mobileNumber: string) => {
    const res = await api.post('/auth/send-otp', { mobileNumber });
    return res.data.data;
  };

  const verifyOtp = async (mobileNumber: string, otp: string) => {
    const res = await api.post('/auth/verify-otp', { mobileNumber, otp });
    const { user: verifiedUser, accessToken } = res.data.data;
    localStorage.setItem('aurapure_access_token', accessToken);
    localStorage.setItem('aurapure_user', JSON.stringify(verifiedUser));
    setUser(verifiedUser);
    return { isNewUser: verifiedUser.isNewUser };
  };

  const resendOtp = async (mobileNumber: string) => {
    const res = await api.post('/auth/resend-otp', { mobileNumber });
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('aurapure_access_token');
      localStorage.removeItem('aurapure_user');
      setUser(null);
    }
  };

  const logoutAll = async () => {
    try {
      await api.post('/auth/logout-all');
    } catch {
      // Ignore
    } finally {
      localStorage.removeItem('aurapure_access_token');
      localStorage.removeItem('aurapure_user');
      setUser(null);
    }
  };

  const updateProfile = async (data: { name?: string; fullName?: string; email?: string }) => {
    const res = await api.put('/auth/me', data);
    const updated = res.data.data.user;
    setUser(updated);
    localStorage.setItem('aurapure_user', JSON.stringify(updated));
  };

  const changeMobileSendOtp = async () => {
    const res = await api.post('/auth/change-mobile/send-otp');
    return res.data;
  };

  const changeMobileVerifyOld = async (otp: string) => {
    const res = await api.post('/auth/change-mobile/verify-old', { otp });
    return res.data.data;
  };

  const changeMobileSendNewOtp = async (newMobileNumber: string) => {
    const res = await api.post('/auth/change-mobile/send-new-otp', { newMobileNumber });
    return res.data;
  };

  const changeMobileVerifyNew = async (newMobileNumber: string, otp: string, changeToken: string) => {
    const res = await api.post('/auth/change-mobile/verify-new', { newMobileNumber, otp, changeToken });
    await refreshProfile();
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        sendOtp,
        verifyOtp,
        resendOtp,
        logout,
        logoutAll,
        refreshProfile,
        updateProfile,
        changeMobileSendOtp,
        changeMobileVerifyOld,
        changeMobileSendNewOtp,
        changeMobileVerifyNew,
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
