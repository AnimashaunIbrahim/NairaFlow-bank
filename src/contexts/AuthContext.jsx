import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const saved = localStorage.getItem('nairaflow_auth_V1');
      return saved !== null ? saved === 'true' : true; // Default logged in for smooth dev/demo
    } catch {
      return true;
    }
  });

  const login = (email, password) => {
    // Simulated authentication — accept any valid input
    if (email && password) {
      setIsAuthenticated(true);
      try {
        localStorage.setItem('nairaflow_auth_V1', 'true');
      } catch (err) {
        console.warn('Unable to persist auth to localStorage', err);
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.setItem('nairaflow_auth_V1', 'false');
    } catch (err) {
      console.warn('Unable to persist auth to localStorage', err);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be within AuthProvider');
  return ctx;
}
