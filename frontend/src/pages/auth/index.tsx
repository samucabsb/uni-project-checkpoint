/**
 * Páginas de autenticação — v1.6.1
 * FIX: toast duplicado no cadastro eliminado
 * FIX: campo de senha com toggle show/hide (olhinho)
 * FIX: location.state limpo após usar mensagem
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Gamepad2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button, PasswordInput, Input } from '../../components/ui';

// ── Login ─────────────────────────────────────────────────
export function Login() {
  const { login, isAuthenticated } = useAuth();
  const { toast }   = useToast();
  const navigate    = useNavigate();
  const location    = useLocation();
  const [form, setForm]     = useState({ nm_usuario: '', senha_usuario: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) { navigate('/feed'); return; }
    // Mensagem de redirecionamento pós-cadastro — mostrar UMA vez, limpar o state
    const msg = (location.state as { message?: string } | null)?.message;
    if (msg) {
      toast(msg, 'success');
      // Limpa o state para não re-exibir ao voltar para a página
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nm_usuario || !form.senha_usuario) return toast('Preencha todos os campos.', 'error');
    setLoading(true);
    try {
      await login(form.nm_usuario, form.senha_usuario);
      navigate('/feed');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Usuário ou senha incorretos.';
      toast(msg, 'error');
    } finally { setLoading(false); }
  }

  return (
    <AuthLayout title="Bem-vindo de volta" subtitle="Entre na sua conta para continuar.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nome de usuário" value={form.nm_usuario} autoComplete="username"
          onChange={e => setForm(f => ({ ...f, nm_usuario: e.target.value }))} placeholder="seu_usuario"/>
        <PasswordInput label="Senha" value={form.senha_usuario} autoComplete="current-password"
          onChange={e => setForm(f => ({ ...f, senha_usuario: e.target.value }))}/>
        <Button type="submit" loading={loading} className="w-full mt-2">Entrar</Button>
      </form>
      <p className="mt-6 text-center text-sm text-zinc-500">
        Não tem conta?{' '}
        <Link to="/cadastro" className="font-bold text-checkpoint-green hover:underline">Criar conta grátis</Link>
      </p>
    </AuthLayout>
  );
}

// ── Cadastro ──────────────────────────────────────────────
export function Register() {
  const { register, isAuthenticated } = useAuth();
  const { toast }   = useToast();
  const navigate    = useNavigate();
  const [form, setForm]     = useState({ nm_usuario: '', email_usuario: '', senha_usuario: '', confirmar: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (isAuthenticated) navigate('/feed'); }, [isAuthenticated, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nm_usuario || !form.email_usuario || !form.senha_usuario) return toast('Preencha todos os campos.', 'error');
    if (form.senha_usuario !== form.confirmar) return toast('As senhas não coincidem.', 'error');
    if (form.senha_usuario.length < 6) return toast('Senha precisa de pelo menos 6 caracteres.', 'error');

    setLoading(true);
    try {
      const msg = await register({
        nm_usuario:    form.nm_usuario.toLowerCase().trim(),
        email_usuario: form.email_usuario.toLowerCase().trim(),
        senha_usuario: form.senha_usuario,
      });
      // Redireciona para login com mensagem — O toast será exibido LÁ (único lugar)
      navigate('/login', { state: { message: msg || 'Conta criada! Faça login para continuar.' } });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao criar conta.';
      toast(msg, 'error');
    } finally { setLoading(false); }
  }

  return (
    <AuthLayout title="Criar conta" subtitle="Junte-se à comunidade Checkpoint.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nome de usuário" value={form.nm_usuario} autoComplete="username"
          onChange={e => setForm(f => ({ ...f, nm_usuario: e.target.value }))} placeholder="seu_usuario"/>
        <Input label="E-mail" type="email" value={form.email_usuario} autoComplete="email"
          onChange={e => setForm(f => ({ ...f, email_usuario: e.target.value }))} placeholder="seu@email.com"/>
        <PasswordInput label="Senha" value={form.senha_usuario} autoComplete="new-password"
          onChange={e => setForm(f => ({ ...f, senha_usuario: e.target.value }))}/>
        <PasswordInput label="Confirmar senha" value={form.confirmar} autoComplete="new-password"
          onChange={e => setForm(f => ({ ...f, confirmar: e.target.value }))}/>
        <Button type="submit" loading={loading} className="w-full mt-2">Criar conta</Button>
      </form>
      <p className="mt-6 text-center text-sm text-zinc-500">
        Já tem conta?{' '}
        <Link to="/login" className="font-bold text-checkpoint-green hover:underline">Entrar</Link>
      </p>
    </AuthLayout>
  );
}

// ── Layout compartilhado ──────────────────────────────────
function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="card w-full max-w-md rounded-3xl p-8">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Link to="/" className="grid h-14 w-14 place-items-center rounded-2xl bg-checkpoint-green text-black">
            <Gamepad2 size={28}/>
          </Link>
          <h1 className="text-2xl font-black">{title}</h1>
          <p className="text-sm text-zinc-400">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
