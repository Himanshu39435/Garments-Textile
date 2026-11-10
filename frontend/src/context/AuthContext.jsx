import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { getCurrentUser } from '@/services/api/authApi';
import { TOKEN_STORAGE_KEY } from '@/utils/constants';

export const AuthContext = createContext(null);

/**
 * Holds the signed-in user. On load, a stored token is checked with the server (GET /auth/me),
 * so a revoked or expired token never leaves the UI in a signed-in state.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(TOKEN_STORAGE_KEY)));

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_STORAGE_KEY)) return;
    getCurrentUser()
      .then((response) => setUser(response.data.user))
      .catch(() => localStorage.removeItem(TOKEN_STORAGE_KEY))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  /** Call with the `{ token, user }` object returned by login / verify-otp / change-password. */
  const startSession = useCallback(({ token, user: nextUser }) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, isAuthenticated: Boolean(user), isAdmin: user?.role === 'admin', isStaff: user?.role === 'staff', isCustomer: user?.role === 'customer', startSession, updateUser: setUser, logout }),
    [user, loading, startSession, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
