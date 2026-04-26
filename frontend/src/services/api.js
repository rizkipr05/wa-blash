import axios from 'axios';

const resolveApiBaseUrl = () => {
  const envBase = (import.meta.env.VITE_API_URL || '').trim();
  if (!envBase) return '/api';
  return envBase.endsWith('/api') ? envBase : `${envBase}/api`;
};

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
