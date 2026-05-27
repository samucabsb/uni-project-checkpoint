/**
 * Contexto de autenticação
 *
 * BUG CORRIGIDO: O setLoading(false) agora só é chamado
 * DEPOIS que o refreshMe() termina (ou falha), eliminando
 * o flash de tela não-autenticada (race condition).
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../services/api';

export type AuthUser = {
  id_usuario:    number;
  nm_usuario:    string;
  email_usuario: string;
  tipo_usuario:  'USER' | 'ADMIN';
  bio_usuario?:  string | null;
  img_usuario?:  string | null;
  _count?: {
    seguidores: number;
    seguindo:   number;
    avaliacoes: number;
    listas:     number;
  };
};

type AuthContextData = {
  user:            AuthUser | null;
  loading:         boolean;
  isAuthenticated: boolean;
  login:           (nm_usuario: string, senha: string) => Promise<void>;
  register:        (dados: { nm_usuario: string; email_usuario: string; senha_usuario: string }) => Promise<string>;
  logout:          () => void;
  refreshMe:       () => Promise<void>;
};

const AuthContext = createContext<AuthContextData | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]     = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  function logout() {
    localStorage.removeItem('@checkpoint:token');
    localStorage.removeItem('@checkpoint:user');
    setUser(null);
  }

  async function refreshMe() {
    const res = await api.get<AuthUser>('/auth/me');
    setUser(res.data);
    localStorage.setItem('@checkpoint:user', JSON.stringify(res.data));
  }

  // Valida token ao montar — setLoading(false) APÓS resolução
  useEffect(() => {
    const token  = localStorage.getItem('@checkpoint:token');
    const stored = localStorage.getItem('@checkpoint:user');

    if (!token) {
      setLoading(false);
      return;
    }

    // Carrega usuário do storage imediatamente (sem flash)
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignora JSON inválido */ }
    }

    // Valida com o servidor em paralelo
    refreshMe()
      .catch(logout)
      .finally(() => setLoading(false)); // ← loading termina APÓS a validação
  }, []);

  async function login(nm_usuario: string, senha_usuario: string) {
    const res = await api.post('/auth/login', { nm_usuario, senha_usuario });
    const { user: u, token } = res.data;
    localStorage.setItem('@checkpoint:token', token);
    localStorage.setItem('@checkpoint:user', JSON.stringify(u));
    setUser(u);
  }

  async function register(dados: { nm_usuario: string; email_usuario: string; senha_usuario: string }): Promise<string> {
    const res = await api.post('/auth/register', dados);
    return res.data.message as string;
  }

  return (
    <AuthContext.Provider value={{
      user, loading,
      isAuthenticated: !!user,
      login, register, logout, refreshMe,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextData {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
