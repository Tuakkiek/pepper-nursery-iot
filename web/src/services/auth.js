/**
 * Auth Service — Quản lý xác thực và phân quyền người dùng (JWT)
 * Hỗ trợ 2 roles: admin và user theo docs/contracts/api.md
 */

import { BACKEND_URL } from '../config.js';

const TOKEN_KEY = 'pepper_nursery_jwt_token';
const USER_KEY = 'pepper_nursery_user_info';

export const authService = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  getUser() {
    try {
      const u = localStorage.getItem(USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  isAdmin() {
    const user = this.getUser();
    return user && user.role === 'admin';
  },

  setSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  async login(username, password) {
    const res = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || data.message || 'Đăng nhập không thành công');
    }

    this.setSession(data.token, data.user);
    return data;
  },

  async register(payload) {
    const res = await fetch(`${BACKEND_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || data.message || 'Đăng ký tài khoản thất bại');
    }

    if (data.token && data.user) {
      this.setSession(data.token, data.user);
    }
    return data;
  },

  async verifySession() {
    const token = this.getToken();
    if (!token) return null;

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          return data.user;
        }
      } else {
        this.clearSession();
      }
    } catch {
      // offline or network error, keep current local cache
    }
    return this.getUser();
  }
};

