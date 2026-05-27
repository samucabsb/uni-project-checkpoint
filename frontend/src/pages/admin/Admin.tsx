/**
 * Painel Admin — v1.5
 * Tabs: Dashboard | Jogos | Usuários
 * Confirmação ao promover/rebaixar usuário
 */

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart2, Gamepad2, Users, Pencil, Trash2, Check, X, Shield, ShieldOff } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Header, Button, Input, Skeleton, Modal } from '../../components/ui';
import { Jogo, Usuario } from '../../types';

type Tab = 'dashboard' | 'jogos' | 'usuarios';

const JOGO_VAZIO = { nm_jogo:'', img_jogo:'', genero:'', plataforma:'', classificacao:'', descricao:'', dt_jogo:'' };

// ── Dashboard ─────────────────────────────────────────────
function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey:['admin','dashboard'], queryFn:()=>api.get('/admin/dashboard').then(r=>r.data) });
  if (isLoading) return <div className="grid gap-4 sm:grid-cols-3">{[1,2,3,4,5,6].map(i=><Skeleton key={i} className="h-28 rounded-2xl"/>)}</div>;
  const t = data?.totais || {};
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {[
        { l:'Usuários',   v: t.usuarios,   icon: '👤' },
        { l:'Jogos',      v: t.jogos,      icon: '🎮' },
        { l:'Avaliações', v: t.avaliacoes, icon: '⭐' },
        { l:'Listas',     v: t.listas,     icon: '📋' },
        { l:'Na biblioteca',v: t.status,   icon: '📚' },
        { l:'Média geral', v: `★ ${t.mediaGeral || '—'}`, icon: '📊' },
      ].map(({ l, v, icon }) => (
        <div key={l} className="surface rounded-2xl p-6 text-center">
          <p className="text-3xl">{icon}</p>
          <p className="mt-3 text-4xl font-black text-checkpoint-green">{v ?? 0}</p>
          <p className="mt-1 text-sm text-zinc-400">{l}</p>
        </div>
      ))}
    </div>
  );
}

// ── Formulário de Jogo ────────────────────────────────────
function JogoForm({ jogo, onSave, onCancel }: { jogo?: Jogo; onSave: (data: typeof JOGO_VAZIO) => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState(jogo ? {
    nm_jogo: jogo.nm_jogo, img_jogo: jogo.img_jogo, genero: jogo.genero||'',
    plataforma: jogo.plataforma||'', classificacao: jogo.classificacao||'',
    descricao: jogo.descricao||'', dt_jogo: jogo.dt_jogo?.slice(0,10)||'',
  } : { ...JOGO_VAZIO });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nm_jogo||!form.img_jogo||!form.dt_jogo) { toast('Preencha nome, capa e data.','error'); return; }
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  }

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => setForm(p => ({...p,[k]:e.target.value}));

  return (
    <form onSubmit={submit} className="surface rounded-2xl p-6 grid gap-4 md:grid-cols-2">
      <h3 className="text-xl font-black md:col-span-2">{jogo ? 'Editar jogo' : 'Novo jogo'}</h3>
      <Input label="Nome *" value={form.nm_jogo} onChange={f('nm_jogo')} required/>
      <Input label="URL da capa *" type="url" value={form.img_jogo} onChange={f('img_jogo')} required/>
      <Input label="Gênero"        value={form.genero}        onChange={f('genero')}/>
      <Input label="Plataforma"    value={form.plataforma}    onChange={f('plataforma')}/>
      <Input label="Classificação" value={form.classificacao} onChange={f('classificacao')}/>
      <Input label="Data *" type="date" value={form.dt_jogo}  onChange={f('dt_jogo')} required/>
      <label className="block md:col-span-2">
        <span className="mb-2 block text-sm text-zinc-300">Descrição</span>
        <textarea value={form.descricao} onChange={f('descricao')} className="min-h-20 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-checkpoint-green transition-colors"/>
      </label>
      {form.img_jogo && (
        <div className="md:col-span-2 flex items-center gap-3">
          <img src={form.img_jogo} alt="Preview" className="h-16 w-12 rounded object-cover border border-zinc-700"
            onError={e=>{(e.target as HTMLImageElement).style.opacity='0.3';}}/>
          <span className="text-xs text-zinc-400">Preview da capa</span>
        </div>
      )}
      <div className="flex gap-2 md:col-span-2">
        <Button loading={saving} type="submit"><Check size={16}/>{jogo?'Salvar':'Criar'}</Button>
        <Button type="button" variant="secondary" onClick={onCancel}><X size={16}/>Cancelar</Button>
      </div>
    </form>
  );
}

// ── Aba Jogos ─────────────────────────────────────────────
function TabJogos() {
  const { toast } = useToast();
  const qc        = useQueryClient();
  const [editId, setEditId] = useState<number|null>(null);
  const [newForm, setNewForm] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Jogo|null>(null);
  const [search, setSearch] = useState('');

  const { data: jogos=[], isLoading } = useQuery<Jogo[]>({ queryKey:['games',{}], queryFn:()=>api.get('/games').then(r=>r.data) });
  const filtered = jogos.filter(j => j.nm_jogo.toLowerCase().includes(search.toLowerCase()));

  async function saveGame(id: number|null, data: typeof JOGO_VAZIO) {
    try {
      if (id) { await api.put('/games/'+id, data); toast('Jogo atualizado.'); setEditId(null); }
      else    { await api.post('/games',     data); toast('Jogo criado!');    setNewForm(false); }
      qc.invalidateQueries({ queryKey: ['games'] });
    } catch (err: unknown) {
      toast((err as { response?:{data?:{message?:string}} })?.response?.data?.message||'Erro.','error');
      throw err;
    }
  }

  async function deleteGame(jogo: Jogo) {
    try { await api.delete('/games/'+jogo.id_jogo); toast('Jogo excluído.'); setConfirmDel(null); qc.invalidateQueries({queryKey:['games']}); }
    catch { toast('Erro ao excluir.','error'); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input placeholder="Buscar jogo…" value={search} onChange={e=>setSearch(e.target.value)} className="flex-1"/>
        <Button onClick={()=>setNewForm(v=>!v)}>+ Novo jogo</Button>
      </div>
      {newForm && <JogoForm onSave={d=>saveGame(null,d)} onCancel={()=>setNewForm(false)}/>}
      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i=><Skeleton key={i} className="h-16 rounded-xl"/>)}</div>
      ) : filtered.map(j => (
        editId===j.id_jogo ? (
          <JogoForm key={j.id_jogo} jogo={j} onSave={d=>saveGame(j.id_jogo,d)} onCancel={()=>setEditId(null)}/>
        ) : (
          <div key={j.id_jogo} className="card flex items-center gap-4 rounded-2xl p-4">
            <img src={j.img_jogo} className="h-16 w-12 rounded object-cover flex-shrink-0" alt={j.nm_jogo}/>
            <div className="flex-1 min-w-0">
              <p className="font-black truncate">{j.nm_jogo}</p>
              <p className="text-xs text-zinc-400">{j.genero} · {j.plataforma} · ★ {j.media||'—'} ({j.total_avaliacoes||0} avaliações)</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={()=>setEditId(j.id_jogo)} className="rounded-lg p-2 hover:bg-zinc-700 transition" title="Editar"><Pencil size={16}/></button>
              <button onClick={()=>setConfirmDel(j)} className="rounded-lg p-2 text-red-400 hover:bg-red-900/20 transition" title="Excluir"><Trash2 size={16}/></button>
            </div>
          </div>
        )
      ))}
      <Modal open={!!confirmDel} onClose={()=>setConfirmDel(null)} title="Excluir jogo">
        <p className="text-zinc-400 mb-6">Excluir <strong className="text-white">{confirmDel?.nm_jogo}</strong>? Avaliações e listas relacionadas serão removidas.</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={()=>setConfirmDel(null)}>Cancelar</Button>
          <Button variant="danger" onClick={()=>confirmDel&&deleteGame(confirmDel)}>Excluir permanentemente</Button>
        </div>
      </Modal>
    </div>
  );
}

// ── Aba Usuários ──────────────────────────────────────────
function TabUsuarios() {
  const { toast } = useToast();
  const qc        = useQueryClient();
  const [confirmTipo, setConfirmTipo] = useState<{u:Usuario;tipo:'USER'|'ADMIN'}|null>(null);
  const [confirmDel, setConfirmDel]   = useState<Usuario|null>(null);
  const [search, setSearch] = useState('');

  const { data: usuarios=[], isLoading } = useQuery<Usuario[]>({ queryKey:['admin','users'], queryFn:()=>api.get('/users').then(r=>r.data) });
  const filtered = usuarios.filter(u => u.nm_usuario.toLowerCase().includes(search.toLowerCase()));

  async function changeTipo({ u, tipo }: { u: Usuario; tipo: 'USER'|'ADMIN' }) {
    try { await api.put(`/users/${u.id_usuario}/tipo`, { tipo_usuario: tipo }); toast('Permissão alterada.'); setConfirmTipo(null); qc.invalidateQueries({queryKey:['admin','users']}); }
    catch { toast('Erro ao alterar.','error'); }
  }

  async function deleteUser(u: Usuario) {
    try { await api.delete('/users/'+u.id_usuario); toast('Usuário excluído.'); setConfirmDel(null); qc.invalidateQueries({queryKey:['admin','users']}); }
    catch { toast('Erro ao excluir.','error'); }
  }

  return (
    <div className="space-y-4">
      <Input placeholder="Buscar usuário…" value={search} onChange={e=>setSearch(e.target.value)}/>
      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i=><Skeleton key={i} className="h-16 rounded-xl"/>)}</div>
      ) : filtered.map(u => (
        <div key={u.id_usuario} className="card flex items-center gap-4 rounded-2xl p-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-black truncate">@{u.nm_usuario}</p>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${u.tipo_usuario==='ADMIN'?'bg-checkpoint-green/10 text-checkpoint-green':'bg-zinc-800 text-zinc-400'}`}>
                {u.tipo_usuario}
              </span>
            </div>
            <p className="text-xs text-zinc-400">{u.email_usuario} · {u._count?.avaliacoes||0} av. · {u._count?.seguidores||0} seg.</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setConfirmTipo({ u, tipo: u.tipo_usuario==='ADMIN'?'USER':'ADMIN' })}
              className="rounded-lg p-2 hover:bg-zinc-700 transition"
              title={u.tipo_usuario==='ADMIN'?'Rebaixar para USER':'Promover a ADMIN'}
            >
              {u.tipo_usuario==='ADMIN' ? <ShieldOff size={16} className="text-yellow-500"/> : <Shield size={16} className="text-checkpoint-green"/>}
            </button>
            <button onClick={()=>setConfirmDel(u)} className="rounded-lg p-2 text-red-400 hover:bg-red-900/20 transition" title="Excluir"><Trash2 size={16}/></button>
          </div>
        </div>
      ))}

      {/* Confirmação promoção/rebaixamento */}
      <Modal open={!!confirmTipo} onClose={()=>setConfirmTipo(null)} title="Alterar permissão">
        <p className="text-zinc-400 mb-6">
          {confirmTipo?.tipo==='ADMIN' ? `Promover @${confirmTipo?.u.nm_usuario} a ADMIN?` : `Rebaixar @${confirmTipo?.u.nm_usuario} para USER?`}
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={()=>setConfirmTipo(null)}>Cancelar</Button>
          <Button variant={confirmTipo?.tipo==='ADMIN'?'primary':'danger'} onClick={()=>confirmTipo&&changeTipo(confirmTipo)}>
            Confirmar
          </Button>
        </div>
      </Modal>

      <Modal open={!!confirmDel} onClose={()=>setConfirmDel(null)} title="Excluir usuário">
        <p className="text-zinc-400 mb-6">Excluir @<strong className="text-white">{confirmDel?.nm_usuario}</strong>? Todos os dados serão removidos permanentemente.</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={()=>setConfirmDel(null)}>Cancelar</Button>
          <Button variant="danger" onClick={()=>confirmDel&&deleteUser(confirmDel)}>Excluir</Button>
        </div>
      </Modal>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id:'dashboard', label:'Dashboard', icon: <BarChart2 size={16}/> },
  { id:'jogos',     label:'Jogos',     icon: <Gamepad2 size={16}/> },
  { id:'usuarios',  label:'Usuários',  icon: <Users size={16}/> },
];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('dashboard');
  return (
    <div className="space-y-8">
      <Header title="Painel Admin" text="Gerenciamento do Checkpoint." />
      <div className="flex gap-2">
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition ${tab===t.id?'bg-checkpoint-green text-black':'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>
      {tab==='dashboard' && <Dashboard/>}
      {tab==='jogos'     && <TabJogos/>}
      {tab==='usuarios'  && <TabUsuarios/>}
    </div>
  );
}
