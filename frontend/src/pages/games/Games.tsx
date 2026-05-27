/**
 * Catálogo de Jogos com filtros em dropdown e busca
 */

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, X } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button, Header, GameCard, GameCardSkeleton, EmptyState, Input } from '../../components/ui';
import { Jogo } from '../../types';

const GENEROS = [
  'Ação/Aventura', 'RPG de Ação', 'Mundo Aberto', 'Sandbox', 'Metroidvania',
  'FPS Competitivo', 'Battle Royale', 'Aventura', 'Corrida', 'Esportes',
];
const ANOS = ['2026','2025','2024','2023','2022','2021','2020','2019','2018','2017','2013'];
const CLASSIFICACOES = ['Livre','10+','12+','14+','16+','18+'];

function FilterDropdown({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
          value
            ? 'border-checkpoint-green bg-checkpoint-green/10 text-checkpoint-green'
            : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
        }`}
      >
        {value || label}
        {value ? (
          <span onClick={e => { e.stopPropagation(); onChange(''); }} className="hover:text-white cursor-pointer">
            <X size={12} />
          </span>
        ) : (
          <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="dropdown absolute left-0 top-full z-20 mt-1 min-w-[160px] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
            <button onClick={() => { onChange(''); setOpen(false); }} className="block w-full px-4 py-2.5 text-left text-sm text-zinc-400 hover:bg-zinc-900">Todos</button>
            {options.map(opt => (
              <button key={opt} onClick={() => { onChange(opt); setOpen(false); }}
                className={`block w-full px-4 py-2.5 text-left text-sm transition ${value === opt ? 'text-checkpoint-green bg-checkpoint-green/5' : 'hover:bg-zinc-900'}`}>
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function Games() {
  const { user }  = useAuth();
  const { toast } = useToast();
  const qc        = useQueryClient();
  const isAdmin   = user?.tipo_usuario === 'ADMIN';

  const [filters, setFilters] = useState({ search: '', genero: '', ano: '', classificacao: '' });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nm_jogo: '', img_jogo: '', genero: '', plataforma: '', classificacao: '', descricao: '', dt_jogo: '' });
  const [saving, setSaving] = useState(false);

  const { data: jogos = [], isLoading } = useQuery<Jogo[]>({
    queryKey: ['games', filters],
    queryFn:  () => api.get('/games', { params: filters }).then(r => r.data),
  });

  const hasFilters = !!(filters.search || filters.genero || filters.ano || filters.classificacao);

  async function createGame(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/games', form);
      toast('Jogo criado com sucesso!');
      setShowForm(false);
      setForm({ nm_jogo: '', img_jogo: '', genero: '', plataforma: '', classificacao: '', descricao: '', dt_jogo: '' });
      qc.invalidateQueries({ queryKey: ['games'] });
    } catch (err: unknown) {
      toast((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao criar jogo.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <Header title="Catálogo" text={`${jogos.length} jogos disponíveis. Use os filtros para encontrar o certo.`} />

      {/* Barra de filtros */}
      <div className="surface rounded-2xl p-4 space-y-3">
        <Input
          placeholder="Buscar por nome..."
          value={filters.search}
          onChange={e => setFilters({ ...filters, search: e.target.value })}
        />
        <div className="flex flex-wrap gap-2 items-center">
          <FilterDropdown label="Gênero"        value={filters.genero}        options={GENEROS}        onChange={v => setFilters({ ...filters, genero: v })} />
          <FilterDropdown label="Ano"           value={filters.ano}           options={ANOS}           onChange={v => setFilters({ ...filters, ano: v })} />
          <FilterDropdown label="Classificação" value={filters.classificacao} options={CLASSIFICACOES} onChange={v => setFilters({ ...filters, classificacao: v })} />
          {hasFilters && (
            <button onClick={() => setFilters({ search: '', genero: '', ano: '', classificacao: '' })}
              className="text-sm text-zinc-400 hover:text-red-400 transition-colors">
              Limpar filtros
            </button>
          )}
          {isAdmin && (
            <button onClick={() => setShowForm(v => !v)}
              className="ml-auto rounded-xl bg-checkpoint-green px-4 py-2.5 text-sm font-bold text-black hover:brightness-110 transition">
              + Adicionar jogo
            </button>
          )}
        </div>
      </div>

      {/* Formulário de criação (admin) */}
      {showForm && (
        <form onSubmit={createGame} className="surface rounded-2xl p-6 grid gap-4 md:grid-cols-2">
          <h2 className="text-xl font-black md:col-span-2">Novo Jogo</h2>
          <Input label="Nome *" value={form.nm_jogo} onChange={e => setForm({ ...form, nm_jogo: e.target.value })} required />
          <Input label="URL da capa *" type="url" value={form.img_jogo} onChange={e => setForm({ ...form, img_jogo: e.target.value })} required />
          <Input label="Gênero" value={form.genero} onChange={e => setForm({ ...form, genero: e.target.value })} />
          <Input label="Plataforma" value={form.plataforma} onChange={e => setForm({ ...form, plataforma: e.target.value })} />
          <Input label="Classificação" value={form.classificacao} onChange={e => setForm({ ...form, classificacao: e.target.value })} />
          <Input label="Data de lançamento *" type="date" value={form.dt_jogo} onChange={e => setForm({ ...form, dt_jogo: e.target.value })} required />
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm text-zinc-300">Descrição</span>
            <textarea className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-checkpoint-green min-h-20"
              value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
          </label>
          <div className="flex gap-2 md:col-span-2">
            <Button loading={saving}>Criar jogo</Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </form>
      )}

      {/* Grid de jogos */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => <GameCardSkeleton key={i} />)}
        </div>
      ) : jogos.length === 0 ? (
        <EmptyState title="Nenhum jogo encontrado" description="Tente ajustar os filtros ou remova a busca." />
      ) : (
        <div className="grid gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {jogos.map(g => <GameCard key={g.id_jogo} game={g} />)}
        </div>
      )}
    </div>
  );
}
