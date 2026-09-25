import React, { createContext, useContext, useMemo, useState } from 'react';
import apiClient from '../services/api';

const AuthContext = createContext(null);
const TOKEN_KEY = 'payroll_auth_token';
const USER_KEY = 'payroll_auth_user';
const SESSION_TOKEN_KEY = 'payroll_auth_token_session';
const SESSION_USER_KEY = 'payroll_auth_user_session';

const getStorageForRole = (role) => (role === 'admin' ? sessionStorage : localStorage);

const clearOppositeStorage = (role) => {
  const oppositeStorage = role === 'admin' ? localStorage : sessionStorage;
  oppositeStorage.removeItem(TOKEN_KEY);
  oppositeStorage.removeItem(USER_KEY);
  oppositeStorage.removeItem(SESSION_TOKEN_KEY);
  oppositeStorage.removeItem(SESSION_USER_KEY);
};

const readSavedUser = () => {
  const sessionUser = sessionStorage.getItem(SESSION_USER_KEY) || sessionStorage.getItem(USER_KEY);
  if (sessionUser) return JSON.parse(sessionUser);
  const savedUser = localStorage.getItem(USER_KEY);
  return savedUser ? JSON.parse(savedUser) : null;
};

const readSavedToken = () => {
  const sessionToken = sessionStorage.getItem(SESSION_TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  if (sessionToken) return sessionToken;
  return localStorage.getItem(TOKEN_KEY);
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => readSavedToken());
  const [user, setUser] = useState(() => readSavedUser());

  const login = async (email, password, captcha = null) => {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
      captchaToken: captcha?.token || null,
    });
    if (!response.data.requiresTwoFactor) {
      saveSession(response.data);
    }
    return response.data;
  };

  const verifyTwoFactorLogin = async (tempToken, token) => {
    const response = await apiClient.post('/auth/2fa/verify-login', { tempToken, token });
    saveSession(response.data);
    return response.data;
  };

  const register = async (name, email, password) => {
    const response = await apiClient.post('/auth/register', { name, email, password });
    return response.data;
  };

  const saveSession = ({ token: nextToken, data: nextUser }) => {
    const storage = getStorageForRole(nextUser?.role);
    const alternateStorage = nextUser?.role === 'admin' ? localStorage : sessionStorage;

    if (nextUser?.role === 'admin') {
      sessionStorage.setItem(SESSION_TOKEN_KEY, nextToken);
      sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(nextUser));
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } else {
      storage.setItem(TOKEN_KEY, nextToken);
      storage.setItem(USER_KEY, JSON.stringify(nextUser));
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
      sessionStorage.removeItem(SESSION_USER_KEY);
    }

    alternateStorage.removeItem(TOKEN_KEY);
    alternateStorage.removeItem(USER_KEY);
    alternateStorage.removeItem(SESSION_TOKEN_KEY);
    alternateStorage.removeItem(SESSION_USER_KEY);

    setToken(nextToken);
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_USER_KEY);
    setToken(null);
    setUser(null);
  };

  const hasRole = (...allowedRoles) => !!user && allowedRoles.includes(user.role);

  const value = useMemo(
    () => ({ token, user, login, verifyTwoFactorLogin, register, logout, hasRole }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
