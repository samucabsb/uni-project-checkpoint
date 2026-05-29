/**
 * VitrineSection — seção completa da vitrine no perfil
 * Renderiza cards + botão editar + estado vazio com CTA
 */

import { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui';
import { VitrineCard } from './VitrineCard';
import { VitrineEditor } from './VitrineEditor';
import { StatusJogo } from '../../types';

interface Props {
  vitrine:   StatusJogo[];
  isOwner:   boolean;
  profileId: number;
}

export function VitrineSection({ vitrine, isOwner, profileId }: Props) {
  const { toast } = useToast();
  const qc        = useQueryClient();
  const [editorOpen, setEditorOpen]   = useState(false);
  const [removing, setRemoving]       = useState<number | null>(null);

  async function handleRemove(position: number) {
    setRemoving(position);
    try {
      await api.delete(`/users/vitrine/${position}`);
      qc.invalidateQueries({ queryKey: ['profile', String(profileId)] });
      toast('Removido da vitrine.');
    } catch { toast('Erro ao remover.', 'error'); }
    finally { setRemoving(null); }
  }

  return (
    <section>
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-xl font-black">Vitrine</h2>
        {isOwner && (
          <button onClick={() => setEditorOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold hover:bg-zinc-700 transition">
            <Pencil size={12}/> Editar
          </button>
        )}
      </div>

      {/* Estado vazio */}
      {vitrine.length === 0 ? (
        isOwner ? (
          <div className="card rounded-2xl p-8 text-center space-y-3">
            <p className="font-black text-lg">Sua vitrine está vazia</p>
            <p className="text-sm text-zinc-400">Destaque até 4 jogos favoritos no seu perfil.</p>
            <Button onClick={() => setEditorOpen(true)} className="mx-auto flex items-center gap-2">
              <Plus size={15}/> Montar Vitrine
            </Button>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Este usuário ainda não montou a vitrine.</p>
        )
      ) : (
        /* Grid 4 colunas */
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {vitrine.map(s => (
            <VitrineCard
              key={s.id_jogo}
              item={s}
              isOwner={isOwner}
              removing={removing === s.top_position}
              onRemove={() => handleRemove(s.top_position!)}
            />
          ))}
        </div>
      )}

      <VitrineEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        vitrine={vitrine}
        onUpdated={() => qc.invalidateQueries({ queryKey: ['profile', String(profileId)] })}
      />
    </section>
  );
}
