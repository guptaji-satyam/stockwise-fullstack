import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('stockwise_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('stockwise_token') || null);
  const [loading, setLoading] = useState(true);

  // Validate existing token with /auth/me on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('stockwise_token');
      if (storedToken) {
        try {
          const res = await authService.getMe();
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem('stockwise_user', JSON.stringify(res.data));
          } else {
            logout();
          }
        } catch (error) {
          console.warn('[Auth] Session validation failed:', error?.message);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const response = await authService.login({ email, password });
    if (response.success && response.data) {
      const { token: newToken, ...userData } = response.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('stockwise_token', newToken);
      localStorage.setItem('stockwise_user', JSON.stringify(userData));
    }
    return response;
  };

  const register = async (userData) => {
    const response = await authService.register(userData);
    if (response.success && response.data) {
      const { token: newToken, ...userPayload } = response.data;
      setToken(newToken);
      setUser(userPayload);
      localStorage.setItem('stockwise_token', newToken);
      localStorage.setItem('stockwise_user', JSON.stringify(userPayload));
    }
    return response;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('stockwise_token');
    localStorage.removeItem('stockwise_user');
  };

  const updateProfile = async (profileData) => {
    const response = await authService.updateProfile(profileData);
    if (response.success && response.data) {
      const updated = { ...user, ...response.data };
      setUser(updated);
      localStorage.setItem('stockwise_user', JSON.stringify(updated));
    }
    return response;
  };

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    isAdmin,
    isStaff,
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
