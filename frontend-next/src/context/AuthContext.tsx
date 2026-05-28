'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  username: string;
  email: string;
  location?: string;
  bio?: string;
}

interface AuthContextProps {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: UserProfile) => void;
  register: (token: string, user: UserProfile) => void;
  logout: () => void;
  updateUserLocal: (updated: UserProfile) => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('verifyit-token');
    const savedUser = localStorage.getItem('verifyit-user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const login = (jwtToken: string, userProfile: UserProfile) => {
    setToken(jwtToken);
    setUser(userProfile);
    localStorage.setItem('verifyit-token', jwtToken);
    localStorage.setItem('verifyit-user', JSON.stringify(userProfile));
  };

  const register = (jwtToken: string, userProfile: UserProfile) => {
    setToken(jwtToken);
    setUser(userProfile);
    localStorage.setItem('verifyit-token', jwtToken);
    localStorage.setItem('verifyit-user', JSON.stringify(userProfile));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('verifyit-token');
    localStorage.removeItem('verifyit-user');
  };

  const updateUserLocal = (updated: UserProfile) => {
    setUser(updated);
    localStorage.setItem('verifyit-user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUserLocal }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
