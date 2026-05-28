import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Shield, Gamepad2, Users, Star, List, Activity } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Jogo } from '../../types';
import { Button, Input, TextArea, Skeleton } from '../../components/ui';

export default function AdminPage() {
  const { toast } = useToast();
  const qc        = useQueryClient();
  const [tab, setTab] = useState<'dashboard'|'jogos'>('dashboard');
  const [form, setForm] = useState({ nm_jogo:'', img_jogo:'', genero:'', plataforma:'', classificacao:'', descricao:'', dt_jogo:'' });
  const [editId, setEditId]   = useState<number|null>(null);
  const [loading, setLoading] = useState(false);

  const { data: dash } = useQuery({ queryKey:['admin-dash'], queryFn: () => api.get('/admin/dashboard').then(r => r.data) });
  const { data: jogos=[], isLoading } = useQuery<Jogo[]>({ queryKey:['games'], queryFn: () => api.get('/games').then(r => r.data) });

  async function handleSubmit() {
    if (!form.nm_jogo||!form.img_jogo||!form.dt_jogo) return toast('Nome, imagem e data são obrigatórios.','error');
    setLoading(true);
    try {
      if (editId) { await api.put(`/games/${editId}`, form); toast('Jogo atualizado!'); setEditId(null); }
      else        { await api.post('/games', form);          toast('Jogo criado!'); }
      qc.invalidateQueries({ queryKey:['games'] });
      setForm({ nm_jogo:'', img_jogo:'', genero:'', plataforma:'', classificacao:'', descricao:'', dt_jogo:'' });
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Erro ao salvar.';
      toast(msg, 'error');
    } finally { setLoading(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm('Excluir este jogo e todas as avaliações relacionadas?')) return;
    try { await api.delete(`/games/${id}`); toast('Jogo excluído.'); qc.invalidateQueries({ queryKey:['games'] }); }
    catch { toast('Erro ao excluir.','error'); }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-400/10"><Shield size={20} className="text-yellow-400"/></div>
        <div><h1 className="text-3xl font-black">Painel Admin</h1><p className="text-sm text-zinc-500">Gerenciamento do sistema</p></div>
      </div>

      <div className="flex gap-2">
        {(['dashboard','jogos'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold transition capitalize ${tab===t?'bg-checkpoint-green text-black':'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="space-y-6">
          {!dash ? <Skeleton className="h-40 rounded-2xl"/> : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { icon: <Users size={18}/>,    label: 'Usuários',    v: dash.totais.usuarios    },
                { icon: <Gamepad2 size={18}/>, label: 'Jogos',       v: dash.totais.jogos       },
                { icon: <Star size={18}/>,     label: 'Avaliações',  v: dash.totais.avaliacoes  },
                { icon: <List size={18}/>,     label: 'Listas',      v: dash.totais.listas      },
                { icon: <Activity size={18}/>, label: 'Atividades',  v: dash.totais.atividades  },
                { icon: <Star size={18}/>,     label: 'Média geral', v: `★ ${dash.totais.mediaGeral}` },
              ].map(({ icon, label, v }) => (
                <div key={label} className="card rounded-2xl p-4 text-center">
                  <div className="flex justify-center text-checkpoint-green mb-2">{icon}</div>
                  <p className="text-2xl font-black">{v}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'jogos' && (
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Formulário */}
          <div className="card rounded-2xl p-6 space-y-4">
            <h2 className="font-black text-lg">{editId ? 'Editar jogo' : 'Adicionar jogo'}</h2>
            <Input label="Nome *" value={form.nm_jogo} onChange={e => setForm(f => ({...f, nm_jogo: e.target.value}))} placeholder="Ex: Elden Ring"/>
            <Input label="URL da imagem *" value={form.img_jogo} onChange={e => setForm(f => ({...f, img_jogo: e.target.value}))} placeholder="https://..."/>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Gênero" value={form.genero} onChange={e => setForm(f => ({...f, genero: e.target.value}))} placeholder="RPG"/>
              <Input label="Classificação" value={form.classificacao} onChange={e => setForm(f => ({...f, classificacao: e.target.value}))} placeholder="18+"/>
            </div>
            <Input label="Plataformas" value={form.plataforma} onChange={e => setForm(f => ({...f, plataforma: e.target.value}))} placeholder="PC / PS5"/>
            <Input label="Data de lançamento *" type="date" value={form.dt_jogo} onChange={e => setForm(f => ({...f, dt_jogo: e.target.value}))}/>
            <TextArea label="Descrição" value={form.descricao} onChange={e => setForm(f => ({...f, descricao: e.target.value}))} placeholder="Sobre o jogo…"/>
            <div className="flex gap-3">
              <Button onClick={handleSubmit} loading={loading} className="flex-1">{editId ? 'Atualizar' : 'Criar jogo'}</Button>
              {editId && <Button variant="secondary" onClick={() => { setEditId(null); setForm({ nm_jogo:'', img_jogo:'', genero:'', plataforma:'', classificacao:'', descricao:'', dt_jogo:'' }); }}>Cancelar</Button>}
            </div>
          </div>

          {/* Lista de jogos */}
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {isLoading ? [1,2,3].map(i=><Skeleton key={i} className="h-16 rounded-xl"/>) : jogos.map(j => (
              <div key={j.id_jogo} className="card flex items-center gap-3 rounded-xl p-3">
                <img src={j.img_jogo} alt={j.nm_jogo} onError={e=>{(e.target as HTMLImageElement).src='https://placehold.co/40x56/18181f/00e187?text=?';}} className="h-14 w-10 flex-shrink-0 rounded-lg object-cover"/>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{j.nm_jogo}</p>
                  <p className="text-xs text-zinc-500">{j.genero} · {new Date(j.dt_jogo).getFullYear()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditId(j.id_jogo); setForm({ nm_jogo:j.nm_jogo||'', img_jogo:j.img_jogo||'', genero:j.genero||'', plataforma:j.plataforma||'', classificacao:j.classificacao||'', descricao:j.descricao||'', dt_jogo:j.dt_jogo?j.dt_jogo.split('T')[0]:'' }); setTab('jogos'); }}
                    className="rounded-lg bg-zinc-800 p-2 text-xs hover:bg-zinc-700 transition">Editar</button>
                  <button onClick={() => handleDelete(j.id_jogo)} className="rounded-lg bg-zinc-800 p-2 text-xs text-red-400 hover:bg-red-900/20 transition">Excluir</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
