import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';

/**
 * useWallet — fetches and keeps token balance in sync.
 *
 * Usage:
 *   const { balance, loading, refresh } = useWallet();
 */
export function useWallet(initialBalance = 0) {
  const [balance, setBalance] = useState(initialBalance);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const b = await api.wallet.getBalance();
      setBalance(b);
      return b;
    } catch (_) {
      return balance;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, []);

  return { balance, setBalance, loading, refresh };
}
