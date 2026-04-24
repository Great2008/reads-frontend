import { useState, useCallback } from 'react';
import { api } from '../services/api.js';

/**
 * useAuth — manages authenticated user state.
 *
 * Usage:
 *   const { user, loading, login, logout, refreshUser } = useAuth();
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      await api.auth.login(email, password);
      const userData = await api.auth.me();
      setUser(userData);
      return userData;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await api.auth.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const userData = await api.auth.me();
    if (userData) setUser(userData);
    return userData;
  }, []);

  return { user, setUser, loading, login, logout, refreshUser };
}
