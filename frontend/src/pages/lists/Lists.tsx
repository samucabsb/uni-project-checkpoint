import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useDebounce } from '../../hooks';
import { Button, Header, Input, EmptyState } from '../../components/ui';
import { Lista } from '../../types';

export function Lists() {
  const { user }  = useAuth();
  const { toast } = useToast();
  const qc        = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch     = useDebounce(search, 400);
  const [form, setForm]     = useState({ nm_lista: '', descricao: '' });
  const [saving, setSaving] = useState(false);

  const { data: listas = [], isLoading } = useQuery<Lista[]>({
    queryKey: ['lists', debouncedSearch],
    queryFn:  () => api.get('/lists', { params: { search: debouncedSearch } }).then(r => r.data),
  });

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!form.nm_lista.trim()) return;
    setSaving(true);
    try {
      await api.post('/lists', { ...form, publica: true });
      toast('Lista criada!');
      setForm({ nm_lista: '', descricao: '' });
      qc.invalidateQueries({ queryKey: ['lists'] });
    } catch { toast('Erro ao criar lista.', 'error'); }
    finally { setSaving(false); }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
      <aside className="h-fit">
        {user ? (
          <form onSubmit={create} className="surface rounded-2xl p-6 space-y-4">
            <h2 className="text-2xl font-black">Criar lista</h2>
            <Input label="Nome" value={form.nm_lista} onChange={e => setForm(f=>({...f,nm_lista:e.target.value}))} placeholder="Ex: RPGs imperdíveis" required />
            <label className="block">
              <span className="mb-2 block text-sm text-zinc-300">Descrição</span>
              <textarea value={form.descricao} onChange={e => setForm(f=>({...f,descricao:e.target.value}))}
                className="min-h-20 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-checkpoint-green transition-colors" placeholder="Opcional..."/>
            </label>
            <Button loading={saving} className="w-full">Salvar lista</Button>
          </form>
        ) : (
          <div className="surface rounded-2xl p-6 text-center space-y-4">
            <h2 className="text-xl font-black">Criar lista</h2>
            <p className="text-sm text-zinc-400">Faça login para criar e gerenciar suas listas de jogos.</p>
            <Link to="/login" className="inline-block w-full rounded-xl bg-checkpoint-green py-3 text-sm font-bold text-black hover:brightness-110 transition">Entrar</Link>
          </div>
        )}
      </aside>

      <div className="space-y-6">
        <Header title="Listas da comunidade" text="Coleções curadas por jogadores." />
        <Input placeholder="Buscar listas por nome, descrição ou criador…" value={search} onChange={e => setSearch(e.target.value)} />
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">{[1,2,3,4].map(i=><div key={i} className="card h-32 animate-pulse rounded-2xl"/>)}</div>
        ) : listas.length === 0 ? (
          <EmptyState title="Nenhuma lista encontrada" description="Crie a primeira lista!" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {listas.map(l => (
              <Link key={l.id_lista} to={`/listas/${l.id_lista}`} className="card card-hover block rounded-2xl p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-black hover:text-checkpoint-green transition-colors line-clamp-2">{l.nm_lista}</h3>
                  <span className="flex-shrink-0 text-xs text-zinc-500">{l.jogos?.length||0} jogos</span>
                </div>
                <p className="mt-1 text-sm text-zinc-400">por @{l.usuario?.nm_usuario}</p>
                {l.descricao && <p className="mt-2 text-sm text-zinc-500 line-clamp-2">{l.descricao}</p>}
                {l.jogos && l.jogos.length > 0 && (
                  <div className="mt-3 flex gap-1.5">
                    {l.jogos.slice(0,5).map(({jogo}) => (
                      <img key={jogo.id_jogo} src={jogo.img_jogo} alt={jogo.nm_jogo} className="h-16 w-11 rounded object-cover"/>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
