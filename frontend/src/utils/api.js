import axios from 'axios';

const api = axios.create({
  baseURL: 'https://flavour-pos-backend.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('flavour_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

// Handle token expiry globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('flavour_token');
      localStorage.removeItem('flavour_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
