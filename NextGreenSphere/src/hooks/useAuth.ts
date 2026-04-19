import { useState, useEffect } from 'react';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const authStatus = localStorage.getItem('greensphere_auth');
    setIsAuthenticated(authStatus === 'true');
  }, []);

  const login = (phone: string) => {
    localStorage.setItem('greensphere_auth', 'true');
    localStorage.setItem('greensphere_phone', phone);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('greensphere_auth');
    localStorage.removeItem('greensphere_phone');
    setIsAuthenticated(false);
  };

  return { isAuthenticated, login, logout };
}
