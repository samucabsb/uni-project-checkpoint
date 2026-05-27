/**
 * Painel Administrativo
 * - Métricas do sistema
 * - CRUD completo de jogos (criar, editar inline, excluir com confirmação)
 * - Gestão de usuários (promover/rebaixar)
 * - Avaliações foram removidas desta view (v1.4)
 */

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, Check, X, Plus } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Header, Button, Input, Skeleton, Modal } from '../../components/ui';
import { Jogo, Usuario } from '../../types';

// Valores iniciais do formulário de jogo
const JOGO_VAZIO = {
  nm_jogo: '', img_jogo: '', genero: '',
  plataforma: '', classificacao: '', descricao: '', dt_jogo: '',
};

// ── Formulário de jogo (criar ou editar) ──────────────────
function JogoForm({
  inicial,
  onSave,
  onCancel,
  saving,
}: {
  inicial:   typeof JOGO_VAZIO;
  onSave:    (dados: typeof JOGO_VAZIO) => void;
  onCancel:  () => void;
  saving:    boolean;
}) {
  const [form, setForm] = useState(inicial);
  const set = (k: keyof typeof JOGO_VAZIO) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Input label="Nome *"      value={form.nm_jogo}      onChange={set('nm_jogo')}      required placeholder="Ex: Elden Ring" />
      <Input label="URL da capa *" type="url" value={form.img_jogo} onChange={set('img_jogo')} required placeholder="https://..." />
      <Input label="Gênero"      value={form.genero}       onChange={set('genero')}       placeholder="Ex: RPG de Ação" />
      <Input label="Plataforma"  value={form.plataforma}   onChange={set('plataforma')}   placeholder="Ex: PC, PS5, Xbox" />
      <Input label="Classificação" value={form.classificacao} onChange={set('classificacao')} placeholder="Ex: 16+" />
      <Input label="Data de lançamento *" type="date" value={form.dt_jogo} onChange={set('dt_jogo')} required />
      <label className="block md:col-span-2">
        <span className="mb-2 block text-sm text-zinc-300">Descrição</span>
        <textarea
          value={form.descricao}
          onChange={set('descricao')}
          placeholder="Resumo do jogo..."
          className="min-h-16 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-checkpoint-green"
        />
      </label>
      <div className="flex gap-2 md:col-span-2">
        <Button loading={saving} onClick={() => onSave(form)}>
          <Check size={14} /> Salvar
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          <X size={14} /> Cancelar
        </Button>
      </div>
    </div>
  );
}

// ── Página Admin ──────────────────────────────────────────
export default function AdminPage() {
  const { toast } = useToast();
  const qc        = useQueryClient();

  const { data: stats }         = useQuery({ queryKey: ['admin-stats'],  queryFn: () => api.get('/admin/dashboard').then(r => r.data) });
  const { data: jogos = [], isLoading: loadingJogos } = useQuery<Jogo[]>({ queryKey: ['admin-games'],  queryFn: () => api.get('/games').then(r => r.data) });
  const { data: usuarios = [] } = useQuery<Usuario[]>({ queryKey: ['admin-users'],  queryFn: () => api.get('/users').then(r => r.data) });

  // Estado do formulário de criação
  const [showCreate, setShowCreate] = useState(false);
  const [savingCreate, setSavingCreate] = useState(false);

  // Estado de edição inline (id do jogo em edição)
  const [editingId, setEditingId] = useState<number | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Confirmação de exclusão
  const [confirmDelete, setConfirmDelete] = useState<Jogo | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Criar jogo ─────────────────────────────────────────
  async function createGame(dados: typeof JOGO_VAZIO) {
    if (!dados.nm_jogo || !dados.img_jogo || !dados.dt_jogo) {
      toast('Preencha nome, URL da capa e data.', 'error');
      return;
    }
    setSavingCreate(true);
    try {
      await api.post('/games', dados);
      toast('Jogo criado com sucesso!');
      setShowCreate(false);
      qc.invalidateQueries({ queryKey: ['admin-games'] });
      qc.invalidateQueries({ queryKey: ['games'] });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast(msg || 'Erro ao criar jogo.', 'error');
    } finally {
      setSavingCreate(false);
    }
  }

  // ── Editar jogo ────────────────────────────────────────
  async function saveEdit(id: number, dados: typeof JOGO_VAZIO) {
    if (!dados.nm_jogo || !dados.img_jogo || !dados.dt_jogo) {
      toast('Preencha nome, URL da capa e data.', 'error');
      return;
    }
    setSavingEdit(true);
    try {
      await api.put('/games/' + id, dados);
      toast('Jogo atualizado!');
      setEditingId(null);
      qc.invalidateQueries({ queryKey: ['admin-games'] });
      qc.invalidateQueries({ queryKey: ['games'] });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast(msg || 'Erro ao atualizar jogo.', 'error');
    } finally {
      setSavingEdit(false);
    }
  }

  // ── Excluir jogo ───────────────────────────────────────
  async function deleteGame(jogo: Jogo) {
    setDeleting(true);
    try {
      await api.delete('/games/' + jogo.id_jogo);
      toast(`"${jogo.nm_jogo}" excluído.`);
      setConfirmDelete(null);
      qc.invalidateQueries({ queryKey: ['admin-games'] });
      qc.invalidateQueries({ queryKey: ['games'] });
    } catch {
      toast('Erro ao excluir jogo.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  // ── Promover/rebaixar usuário ──────────────────────────
  async function toggleRole(u: Usuario) {
    const novoTipo = u.tipo_usuario === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      await api.put(`/users/${u.id_usuario}/tipo`, { tipo_usuario: novoTipo });
      toast(`@${u.nm_usuario} agora é ${novoTipo}.`);
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast(msg || 'Erro ao alterar permissão.', 'error');
    }
  }

  return (
    <div className="space-y-10">
      <Header title="Painel Admin" text="Gerencie jogos, usuários e métricas do sistema." />

      {/* ── Métricas ───────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-6">
        {stats ? (
          Object.entries(stats.totais).map(([k, v]) => (
            <div key={k} className="card rounded-2xl p-5">
              <p className="text-xs uppercase tracking-wider text-zinc-400">{k}</p>
              <b className="text-3xl font-black">{String(v)}</b>
            </div>
          ))
        ) : (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))
        )}
      </div>

      {/* ── Gestão de Jogos ────────────────────────────── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-black">Jogos</h2>
          <Button onClick={() => { setShowCreate(v => !v); setEditingId(null); }}>
            <Plus size={14} />
            {showCreate ? 'Cancelar' : 'Novo jogo'}
          </Button>
        </div>

        {/* Formulário de criação */}
        {showCreate && (
          <div className="surface mb-4 rounded-2xl p-5">
            <h3 className="mb-4 font-black text-lg">Novo Jogo</h3>
            <JogoForm
              inicial={JOGO_VAZIO}
              onSave={createGame}
              onCancel={() => setShowCreate(false)}
              saving={savingCreate}
            />
          </div>
        )}

        {/* Lista de jogos */}
        {loadingJogos ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {jogos.map(g => (
              <div key={g.id_jogo} className="card rounded-2xl overflow-hidden">
                {editingId === g.id_jogo ? (
                  /* Modo edição inline */
                  <div className="p-4">
                    <p className="mb-3 text-sm font-bold text-checkpoint-green">Editando: {g.nm_jogo}</p>
                    <JogoForm
                      inicial={{
                        nm_jogo:      g.nm_jogo,
                        img_jogo:     g.img_jogo,
                        genero:       g.genero        || '',
                        plataforma:   g.plataforma    || '',
                        classificacao: g.classificacao || '',
                        descricao:    g.descricao     || '',
                        dt_jogo:      g.dt_jogo.slice(0, 10),
                      }}
                      onSave={dados => saveEdit(g.id_jogo, dados)}
                      onCancel={() => setEditingId(null)}
                      saving={savingEdit}
                    />
                  </div>
                ) : (
                  /* Modo visualização */
                  <div className="flex items-center justify-between p-4 gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={g.img_jogo}
                        alt={g.nm_jogo}
                        className="h-12 w-9 rounded object-cover flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-bold truncate">{g.nm_jogo}</p>
                        <p className="text-xs text-zinc-400">
                          {g.genero} · {new Date(g.dt_jogo).getFullYear()} · {g.plataforma}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => { setEditingId(g.id_jogo); setShowCreate(false); }}
                        className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-bold hover:bg-zinc-700 transition"
                      >
                        <Pencil size={12} /> Editar
                      </button>
                      <button
                        onClick={() => setConfirmDelete(g)}
                        className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition"
                      >
                        <Trash2 size={12} /> Excluir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Gestão de Usuários ─────────────────────────── */}
      <section>
        <h2 className="mb-4 text-2xl font-black">Usuários</h2>
        <div className="space-y-2">
          {usuarios.map(u => (
            <div
              key={u.id_usuario}
              className="card flex items-center justify-between rounded-2xl p-4 gap-4"
            >
              <div className="min-w-0">
                <p className="font-bold">@{u.nm_usuario}</p>
                <p className="text-xs text-zinc-400">
                  {u.email_usuario} ·{' '}
                  <span className={u.tipo_usuario === 'ADMIN' ? 'text-checkpoint-green font-bold' : ''}>
                    {u.tipo_usuario}
                  </span>
                </p>
              </div>
              <Button
                variant="secondary"
                className="flex-shrink-0 py-1.5 px-3 text-xs"
                onClick={() => toggleRole(u)}
              >
                {u.tipo_usuario === 'ADMIN' ? 'Rebaixar' : 'Promover'}
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Modal de confirmação de exclusão ──────────── */}
      <Modal
        open={!!confirmDelete}
        onClose={() => !deleting && setConfirmDelete(null)}
        title="Excluir jogo"
      >
        <p className="text-zinc-400 mb-2">
          Tem certeza que deseja excluir{' '}
          <strong className="text-white">"{confirmDelete?.nm_jogo}"</strong>?
        </p>
        <p className="text-xs text-zinc-500 mb-6">
          Esta ação removerá o jogo de todas as bibliotecas, listas e avaliações.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setConfirmDelete(null)} disabled={deleting}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            loading={deleting}
            onClick={() => confirmDelete && deleteGame(confirmDelete)}
          >
            Excluir permanentemente
          </Button>
        </div>
      </Modal>
    </div>
  );
}
