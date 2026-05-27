/**
 * Listas da comunidade — criar, buscar, adicionar jogos
 */

import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button, Header, Input, GameCard, EmptyState } from '../../components/ui';
import { Lista, Jogo } from '../../types';

export function Lists() {
  const { user }  = useAuth();
  const { toast } = useToast();
  const qc        = useQueryClient();

  const [search, setSearch] = useState('');
  const [form, setForm]     = useState({ nm_lista: '', descricao: '' });
  const [saving, setSaving] = useState(false);

  const { data: listas = [] } = useQuery<Lista[]>({
    queryKey: ['lists', search],
    queryFn:  () => api.get('/lists', { params: { search } }).then(r => r.data),
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
    } catch {
      toast('Erro ao criar lista.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
      {/* Formulário de criação */}
      <form onSubmit={create} className="surface h-fit rounded-2xl p-6 space-y-4">
        <h2 className="text-2xl font-black">Criar lista</h2>
        <Input
          label="Nome"
          value={form.nm_lista}
          onChange={e => setForm({ ...form, nm_lista: e.target.value })}
          placeholder="Ex: RPGs imperdíveis"
          required
        />
        <label className="block">
          <span className="mb-2 block text-sm text-zinc-300">Descrição</span>
          <textarea
            value={form.descricao}
            onChange={e => setForm({ ...form, descricao: e.target.value })}
            className="min-h-20 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-checkpoint-green"
            placeholder="Opcional..."
          />
        </label>
        <Button loading={saving} className="w-full">Salvar lista</Button>
      </form>

      {/* Listagem da comunidade */}
      <div className="space-y-6">
        <Header title="Listas da comunidade" text="Coleções criadas por outros jogadores." />
        <Input
          placeholder="Buscar listas por nome, descrição ou usuário..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {listas.length === 0 ? (
          <EmptyState title="Nenhuma lista encontrada" description="Crie a primeira lista!" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {listas.map(l => (
              <Link
                key={l.id_lista}
                to={`/listas/${l.id_lista}`}
                className="card card-hover rounded-2xl p-5 block"
              >
                <h3 className="font-black hover:text-checkpoint-green transition-colors">{l.nm_lista}</h3>
                <p className="mt-1 text-sm text-zinc-400">por @{l.usuario?.nm_usuario}</p>
                {l.descricao && <p className="mt-2 text-sm text-zinc-500 line-clamp-2">{l.descricao}</p>}
                <div className="mt-4 flex gap-2">
                  {l.jogos?.slice(0, 5).map(({ jogo }) => (
                    <img key={jogo.id_jogo} src={jogo.img_jogo} className="h-20 w-14 rounded object-cover" alt={jogo.nm_jogo} />
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
