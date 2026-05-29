import { Calendar } from 'lucide-react';
import { DiaryEntryCard } from './DiaryEntryCard';
import { DiarioEntry } from '../../types';

interface Props {
  month:     string;
  entries:   DiarioEntry[];
  onDelete:  (id: number) => void;
  deleting:  number | null;
}

export function DiaryMonthGroup({ month, entries, onDelete, deleting }: Props) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <Calendar size={15} className="text-checkpoint-green flex-shrink-0"/>
        <h2 className="text-base font-black capitalize">{month}</h2>
        <span className="text-xs text-zinc-500">{entries.length} entrada{entries.length !== 1 ? 's' : ''}</span>
      </div>
      {entries.map(e => (
        <DiaryEntryCard
          key={e.id_diario}
          entry={e}
          onDelete={onDelete}
          deleting={deleting === e.id_diario}
        />
      ))}
    </section>
  );
}
