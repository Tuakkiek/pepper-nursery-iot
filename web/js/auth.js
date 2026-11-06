/**
 * Pepper Nursery IoT - Quản lý Xác thực & Phân quyền (Auth Service)
 * Hỗ trợ JWT Token, vai trò Admin / User theo docs/contracts/api.md và backend/README.md
 * Không can thiệp backend - Gọi trực tiếp REST API /api/v1/auth/*
 */

import { APP_CONFIG } from './config.js';

const STORAGE_KEY_TOKEN = 'pepper_iot_auth_token';
const STORAGE_KEY_USER = 'pepper_iot_auth_user';

// Mock credentials phục vụ khi chuyển sang chế độ Fixture / Demo
const MOCK_USERS = {
  admin: {
    id: 1,
    username: 'admin',
    full_name: 'Quản trị viên Vườn ươm',
    role: 'admin',
    token: 'mock-jwt-token-admin'
  },
  user: {
    id: 2,
    username: 'user',
    full_name: 'Kỹ thuật viên Vườn ươm',
    role: 'user',
    token: 'mock-jwt-token-user'
  }
};

export class AuthService {
  constructor() {
    this.token = localStorage.getItem(STORAGE_KEY_TOKEN) || null;
    try {
      this.user = JSON.parse(localStorage.getItem(STORAGE_KEY_USER) || 'null');
    } catch (_) {
      this.user = null;
    }
  }

  getBaseUrl() {
    return (APP_CONFIG.apiBaseUrl || 'http://localhost:8000').replace(/\/+$/, '');
  }

  getToken() {
    return this.token;
  }

  getUser() {
    return this.user;
  }

  isAuthenticated() {
    return Boolean(this.token && this.user);
  }

  isAdmin() {
    return Boolean(this.isAuthenticated() && this.user && this.user.role === 'admin');
  }

  setSession(token, user) {
    this.token = token;
    this.user = user;
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  }

  clearSession() {
    this.token = null;
    this.user = null;
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER);
  }

  /**
   * Đăng nhập người dùng
   * @param {string} username 
   * @param {string} password 
   * @returns {Promise<{ user: Object, token: string }>}
   */
  async login(username, password) {
    const trimmedUsername = (username || '').trim();
    const trimmedPassword = (password || '').trim();

    if (!trimmedUsername || !trimmedPassword) {
      throw new Error('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
    }

    // 1. Thử gọi API Backend thật
    const endpoint = `${this.getBaseUrl()}/api/v1/auth/login`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          username: trimmedUsername,
          password: trimmedPassword
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        let msg = 'Đăng nhập không thành công';
        if (response.status === 401) {
          msg = 'Tên đăng nhập hoặc mật khẩu không chính xác.';
        } else if (data.error && data.error.message) {
          msg = data.error.message;
        }
        const err = new Error(msg);
        err.status = response.status;
        err.code = (data.error && data.error.code) || 'login_failed';
        throw err;
      }

      // Lưu phiên
      this.setSession(data.token, data.user);
      return data;
    } catch (err) {
      clearTimeout(timeoutId);

      // Nếu lỗi mạng hoặc backend chưa online và tài khoản khớp mock thì hỗ trợ chế độ demo
      const isNetworkError = err.name === 'AbortError' || (err.message && err.message.includes('Failed to fetch'));
      if (isNetworkError) {
        if (trimmedUsername === 'admin' && trimmedPassword === 'admin123') {
          console.warn('[AuthService] Backend chưa chạy, kích hoạt phiên Demo Admin');
          this.setSession(MOCK_USERS.admin.token, MOCK_USERS.admin);
          return {
            status: 'ok',
            message: 'Đăng nhập thành công (Chế độ Demo mô phỏng)',
            token: MOCK_USERS.admin.token,
            user: MOCK_USERS.admin,
            is_mock: true
          };
        }
        if (trimmedUsername === 'user' && trimmedPassword === 'user123') {
          console.warn('[AuthService] Backend chưa chạy, kích hoạt phiên Demo User');
          this.setSession(MOCK_USERS.user.token, MOCK_USERS.user);
          return {
            status: 'ok',
            message: 'Đăng nhập thành công (Chế độ Demo mô phỏng)',
            token: MOCK_USERS.user.token,
            user: MOCK_USERS.user,
            is_mock: true
          };
        }

        throw new Error(`Không thể kết nối đến máy chủ Backend tại ${this.getBaseUrl()}. Hãy kiểm tra xem Backend đã khởi động (npm run dev) chưa.`);
      }

      throw err;
    }
  }

  /**
   * Đăng ký tài khoản mới
   * @param {Object} payload { username, password, full_name, role }
   * @returns {Promise<{ user: Object, token: string }>}
   */
  async register({ username, password, full_name, role = 'user' }) {
    const trimmedUsername = (username || '').trim();
    const trimmedPassword = (password || '').trim();
    const trimmedFullName = (full_name || '').trim();

    if (trimmedUsername.length < 3) {
      throw new Error('Tên đăng nhập phải có ít nhất 3 ký tự.');
    }
    if (trimmedPassword.length < 6) {
      throw new Error('Mật khẩu phải có ít nhất 6 ký tự.');
    }
    if (!trimmedFullName) {
      throw new Error('Vui lòng nhập họ và tên.');
    }

    const endpoint = `${this.getBaseUrl()}/api/v1/auth/register`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          username: trimmedUsername,
          password: trimmedPassword,
          full_name: trimmedFullName,
          role: role === 'admin' ? 'admin' : 'user'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        let msg = 'Đăng ký tài khoản không thành công';
        if (response.status === 409) {
          msg = `Tên đăng nhập '${trimmedUsername}' đã được sử dụng. Vui lòng chọn tên khác.`;
        } else if (data.error && data.error.message) {
          msg = data.error.message;
        }
        const err = new Error(msg);
        err.status = response.status;
        err.code = (data.error && data.error.code) || 'register_failed';
        throw err;
      }

      // Lưu phiên sau khi đăng ký thành công
      if (data.token && data.user) {
        this.setSession(data.token, data.user);
      }
      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError' || (err.message && err.message.includes('Failed to fetch'))) {
        throw new Error(`Không thể kết nối đến máy chủ Backend tại ${this.getBaseUrl()}. Hãy bật Backend để đăng ký tài khoản vào CSDL.`);
      }
      throw err;
    }
  }

  /**
   * Xác thực token với API /api/v1/auth/me
   */
  async verifySession() {
    if (!this.token) return null;

    if (this.token.startsWith('mock-jwt-token')) {
      return this.user;
    }

    try {
      const endpoint = `${this.getBaseUrl()}/api/v1/auth/me`;
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        this.clearSession();
        return null;
      }

      const data = await response.json();
      if (data.user) {
        this.user = data.user;
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(this.user));
        return this.user;
      }
      return null;
    } catch (_) {
      // Giữ phiên offline nếu tạm thời mất mạng
      return this.user;
    }
  }

  logout() {
    this.clearSession();
  }
}

export const authService = new AuthService();

