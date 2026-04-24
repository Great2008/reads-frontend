import { useState, useCallback } from 'react';

/**
 * useToast — simple toast state manager
 *
 * Usage:
 *   const { toast, showToast, clearToast } = useToast();
 *   ...
 *   showToast('Saved!');
 *   showToast('Something went wrong', 'error');
 *   showToast('Heads up', 'info', 5000);
 *
 *   // In JSX:
 *   {toast && <Toast message={toast.msg} type={toast.type} onClose={clearToast} />}
 */
export function useToast(defaultDuration = 3000) {
  const [toast, setToast] = useState(null);
  const timerRef = { current: null };

  const showToast = useCallback((msg, type = 'success', duration = defaultDuration) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ msg, type });
    timerRef.current = setTimeout(() => setToast(null), duration);
  }, [defaultDuration]);

  const clearToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  return { toast, showToast, clearToast };
}
