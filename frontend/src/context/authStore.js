import { create } from 'zustand';
import api from '../utils/api';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('flavour_user') || 'null'),
  token: localStorage.getItem('flavour_token') || null,
  isLoading: false,
  isAuthenticated: !!localStorage.getItem('flavour_token'),

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('flavour_token', data.token);
      localStorage.setItem('flavour_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
      return { success: true, message: data.message };
    } catch (err) {
      set({ isLoading: false });
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    }
  },

  register: async (formData) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/register', formData);
      localStorage.setItem('flavour_token', data.token);
      localStorage.setItem('flavour_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (err) {
      set({ isLoading: false });
      return { success: false, message: err.response?.data?.message || 'Registration failed' };
    }
  },

  logout: () => {
    localStorage.removeItem('flavour_token');
    localStorage.removeItem('flavour_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (userData) => {
    const updated = { ...get().user, ...userData };
    localStorage.setItem('flavour_user', JSON.stringify(updated));
    set({ user: updated });
  },

  refreshUser: async () => {
    try {
      const { data } = await api.get('/auth/me');
      localStorage.setItem('flavour_user', JSON.stringify(data.user));
      set({ user: data.user });
    } catch {}
  }
}));

export default useAuthStore;
