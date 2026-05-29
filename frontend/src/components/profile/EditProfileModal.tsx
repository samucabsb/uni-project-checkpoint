/**
 * EditProfileModal — edição de perfil com:
 * - Preview ao vivo do avatar
 * - Botão para limpar foto
 * - Seção separada para alterar senha
 * - Validação no frontend
 */

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Lock, Check } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Modal, Button, Input, TextArea, PasswordInput, Avatar } from '../ui';

interface Props {
  open:    boolean;
  onClose: () => void;
  userId:  number;
  current: { bio?: string | null; img?: string | null };
}

export function EditProfileModal({ open, onClose, userId, current }: Props) {
  const { user, refreshMe } = useAuth();
  const { toast }           = useToast();
  const qc                  = useQueryClient();
  const [tab, setTab]       = useState<'perfil' | 'senha'>('perfil');
  const [saving, setSaving] = useState(false);

  const [perfil, setPerfil] = useState({
    bio_usuario: current.bio ?? '',
    img_usuario: current.img ?? '',
  });
  const [senha, setSenha] = useState({ atual: '', nova: '', confirmar: '' });

  const previewUrl = perfil.img_usuario.trim() || user?.img_usuario || '';

  async function savePerfil() {
    setSaving(true);
    try {
      await api.put('/users/me', {
        bio_usuario: perfil.bio_usuario || null,
        img_usuario: perfil.img_usuario || null,
      });
      await refreshMe();
      qc.invalidateQueries({ queryKey: ['profile', String(userId)] });
      toast('Perfil atualizado!');
      onClose();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao salvar.';
      toast(msg, 'error');
    } finally { setSaving(false); }
  }

  async function saveSenha() {
    if (!senha.atual)             return toast('Informe a senha atual.', 'error');
    if (senha.nova.length < 6)    return toast('Nova senha precisa de pelo menos 6 caracteres.', 'error');
    if (senha.nova !== senha.confirmar) return toast('As senhas não coincidem.', 'error');

    setSaving(true);
    try {
      await api.put('/users/me', { senha_atual: senha.atual, senha_nova: senha.nova });
      toast('Senha alterada com sucesso!');
      setSenha({ atual: '', nova: '', confirmar: '' });
      onClose();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao alterar senha.';
      toast(msg, 'error');
    } finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar perfil">
      {/* Tabs internas */}
      <div className="mb-5 flex gap-1 rounded-xl bg-zinc-900 p-1">
        {([['perfil','Perfil','User'],['senha','Senha','Lock']] as [string, string, string][]).map(([t, l]) => (
          <button key={t} onClick={() => setTab(t as 'perfil' | 'senha')}
            className={`flex-1 rounded-lg py-2 text-sm font-bold transition ${tab === t ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'perfil' && (
        <div className="space-y-4">
          {/* Avatar com preview */}
          <div>
            <label className="mb-2 block text-sm font-bold text-zinc-300">Foto de perfil (URL)</label>
            <div className="flex items-center gap-3 mb-2">
              <Avatar src={previewUrl} name={user?.nm_usuario} size="lg"/>
              <div className="flex-1">
                <p className="text-xs text-zinc-500 mb-1">Preview ao vivo</p>
                {perfil.img_usuario && (
                  <button onClick={() => setPerfil(f => ({ ...f, img_usuario: '' }))}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors">
                    Remover foto
                  </button>
                )}
              </div>
            </div>
            <Input value={perfil.img_usuario}
              onChange={e => setPerfil(f => ({ ...f, img_usuario: e.target.value }))}
              placeholder="https://exemplo.com/foto.jpg"/>
          </div>

          <TextArea label="Bio" value={perfil.bio_usuario}
            onChange={e => setPerfil(f => ({ ...f, bio_usuario: e.target.value }))}
            placeholder="Fale um pouco sobre você…" className="min-h-24"/>

          <div className="flex gap-3">
            <Button onClick={savePerfil} loading={saving} className="flex-1">
              <Check size={14}/> Salvar
            </Button>
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          </div>
        </div>
      )}

      {tab === 'senha' && (
        <div className="space-y-4">
          <PasswordInput label="Senha atual" value={senha.atual}
            onChange={e => setSenha(f => ({ ...f, atual: e.target.value }))} autoComplete="current-password"/>
          <PasswordInput label="Nova senha" value={senha.nova}
            onChange={e => setSenha(f => ({ ...f, nova: e.target.value }))} autoComplete="new-password"/>
          <PasswordInput label="Confirmar nova senha" value={senha.confirmar}
            onChange={e => setSenha(f => ({ ...f, confirmar: e.target.value }))} autoComplete="new-password"/>
          <div className="flex gap-3">
            <Button onClick={saveSenha} loading={saving} className="flex-1">
              <Lock size={14}/> Alterar senha
            </Button>
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
