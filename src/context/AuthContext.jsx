import { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tokenBalance, setTokenBalance] = useState(0);

  const refreshUser = useCallback(async () => {
    const userData = await api.auth.me();
    if (userData) {
      setUser(userData);
      const balance = await api.wallet.getBalance();
      setTokenBalance(balance);
      return userData;
    }
    return null;
  }, []);

  const logout = useCallback(async () => {
    await api.auth.logout();
    setUser(null);
    setTokenBalance(0);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, tokenBalance, setTokenBalance, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
