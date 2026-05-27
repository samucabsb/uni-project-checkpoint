/**
 * Instância Axios — usa proxy Vite (/api → localhost:3333)
 * Sem URL hardcoded.
 */

import axios from 'axios';

export const api = axios.create({ baseURL: '/api', timeout: 15_000 });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('@checkpoint:token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  r => r,
  error => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/')) {
      localStorage.removeItem('@checkpoint:token');
      localStorage.removeItem('@checkpoint:user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);
