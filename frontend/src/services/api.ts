/**
 * Instância do Axios configurada
 * Usa /api como baseURL — o proxy do Vite redireciona para localhost:3333
 * Isso evita URL hardcoded e funciona em qualquer ambiente
 */

import axios from 'axios';

export const api = axios.create({
  baseURL: '/api', // Proxy do vite.config.ts
  timeout: 15_000,
});

// Injeta o token JWT automaticamente em toda requisição
api.interceptors.request.use(config => {
  const token = localStorage.getItem('@checkpoint:token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redireciona para login se o token expirou (401)
api.interceptors.response.use(
  response => response,
  error => {
    const isAuthRoute = error.config?.url?.includes('/auth/');
    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('@checkpoint:token');
      localStorage.removeItem('@checkpoint:user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);
