import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Demo mode - للنسخة التجريبية
// Demo mode معطل افتراضياً، يمكن تفعيله عبر VITE_DEMO_MODE=true في .env
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
const DEMO_USER = {
  id: 'demo-user',
  name: 'مستخدم تجريبي',
  email: 'demo@budgetmate.com',
  currency: 'SAR',
  language: 'ar'
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // إذا كان Demo mode مفعّل، استخدم المستخدم التجريبي مباشرة
      if (DEMO_MODE) {
        setUser(DEMO_USER);
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      // الوضع العادي - التحقق من تسجيل الدخول
      try {
        const token = authService.getToken();
        const storedUser = authService.getUser();
        
        if (token && storedUser) {
          try {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
            setIsAuthenticated(true);
          } catch (error) {
            authService.logout();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const { user: loggedInUser } = await authService.login(email, password);
    setUser(loggedInUser);
    setIsAuthenticated(true);
    return loggedInUser;
  };

  const register = async (name, email, password) => {
    const { user: newUser } = await authService.register(name, email, password);
    setUser(newUser);
    setIsAuthenticated(true);
    return newUser;
  };

  const logout = () => {
    if (DEMO_MODE) {
      // في وضع Demo، لا نحتاج للخروج من السيرفر
      setUser(null);
      setIsAuthenticated(false);
    } else {
      authService.logout();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    isDemoMode: DEMO_MODE,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

