/**
 * Diário — v1.7
 * Usa DiaryEntryCard, DiaryMonthGroup e DiaryFormModal
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { DiarioEntry } from '../../types';
import { Header, Button, EmptyState, Skeleton } from '../../components/ui';
import { BackButton } from '../../components/BackButton';
import { DiaryMonthGroup } from '../../components/diary/DiaryMonthGroup';
import { DiaryFormModal } from '../../components/diary/DiaryFormModal';

const DIARY_KEY = ['diary'];

export default function Diary() {
  const { toast }    = useToast();
  const qc           = useQueryClient();
  const [modal, setModal] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const { data: entries=[], isLoading } = useQuery<DiarioEntry[]>({
    queryKey: DIARY_KEY,
    queryFn:  () => api.get('/diary').then(r => r.data),
  });

  const del = useMutation({
    mutationFn: (id: number) => api.delete(`/diary/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: DIARY_KEY }); toast('Entrada excluída.'); },
    onError:   () => toast('Erro ao excluir.', 'error'),
  });

  async function handleDelete(id: number) {
    setDeleting(id);
    del.mutate(id, { onSettled: () => setDeleting(null) });
  }

  // Agrupa por mês/ano
  const grouped = entries.reduce<Record<string, DiarioEntry[]>>((acc, e) => {
    const key = format(new Date(e.data_jogada), 'MMMM yyyy', { locale: ptBR });
    (acc[key] = acc[key] || []).push(e);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <BackButton fallback="/feed" className="mb-2"/>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between">
        <Header title="Meu Diário" text="Registre cada sessão com data, nota e comentário."/>
        <Button onClick={() => setModal(true)} className="flex items-center gap-2 flex-shrink-0">
          <Plus size={16}/> Nova entrada
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i=><Skeleton key={i} className="h-20 rounded-2xl"/>)}</div>
      ) : !entries.length ? (
        <EmptyState title="Diário vazio"
          description="Registre suas sessões de jogo para acompanhar sua jornada."
          action={<Button onClick={() => setModal(true)} className="flex items-center gap-2 mx-auto"><Plus size={16}/> Primeira entrada</Button>}/>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([mes, items]) => (
            <DiaryMonthGroup key={mes} month={mes} entries={items} onDelete={handleDelete} deleting={deleting}/>
          ))}
        </div>
      )}

      <DiaryFormModal open={modal} onClose={() => setModal(false)}/>
    </div>
  );
}
