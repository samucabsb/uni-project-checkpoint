import { FormEvent, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button, Input } from '../../components/ui';

function AuthBox({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 app-bg">
      <div className="w-full max-w-md surface rounded-3xl p-8">
        <div className="mb-6 flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-checkpoint-green text-black font-black text-lg">C</div>
          <span className="text-xl font-black">Checkpoint</span>
        </div>
        <h1 className="text-4xl font-black">{title}</h1>
        {subtitle && <p className="mt-2 text-zinc-400">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [nm, setNm]       = useState('');
  const [pw, setPw]       = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const msg = (location.state as { message?: string })?.message;
    if (msg) toast(msg);
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(nm, pw);
      toast('Login realizado com sucesso!');
      navigate('/feed');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao entrar.';
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthBox title="Entrar" subtitle="Acesse sua conta Checkpoint.">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Usuário" value={nm} onChange={e => setNm(e.target.value)} autoComplete="username" required />
        <Input label="Senha" type="password" value={pw} onChange={e => setPw(e.target.value)} autoComplete="current-password" required />
        <Button loading={loading} className="w-full">Entrar</Button>
      </form>
      <p className="mt-5 text-center text-sm text-zinc-400">
        Não tem conta?{' '}
        <Link to="/cadastro" className="text-checkpoint-green font-semibold hover:underline">Criar conta</Link>
      </p>
      <div className="mt-4 rounded-xl border border-zinc-800 p-4 text-xs text-zinc-500">
        <p className="font-bold mb-1">Contas de teste:</p>
        <p>admin / admin123 · gamer_br / senha123</p>
      </div>
    </AuthBox>
  );
}

export function Register() {
  const { register } = useAuth();
  const { toast }    = useToast();
  const navigate     = useNavigate();
  const [form, setForm]   = useState({ nm_usuario: '', email_usuario: '', senha_usuario: '' });
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const msg = await register(form);
      toast(msg);
      navigate('/login', { state: { message: msg } });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao cadastrar.';
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthBox title="Criar conta" subtitle="Após criar a conta, faça login para continuar.">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Usuário" value={form.nm_usuario} onChange={e => setForm({ ...form, nm_usuario: e.target.value.replace(/\s/g, '') })} minLength={3} required />
        <Input label="E-mail" type="email" value={form.email_usuario} onChange={e => setForm({ ...form, email_usuario: e.target.value })} required />
        <Input label="Senha" type="password" value={form.senha_usuario} onChange={e => setForm({ ...form, senha_usuario: e.target.value })} minLength={6} required />
        <Button loading={loading} className="w-full">Criar conta</Button>
      </form>
      <p className="mt-5 text-center text-sm text-zinc-400">
        Já tem conta?{' '}
        <Link to="/login" className="text-checkpoint-green font-semibold hover:underline">Entrar</Link>
      </p>
    </AuthBox>
  );
}
