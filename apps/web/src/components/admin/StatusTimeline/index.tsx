import type { StatusHistory } from '@/types';
import StatusBadge from './StatusBadge';

export default function StatusTimeline({ entries }: { entries: StatusHistory[] }) {
  return (
    <ol className="relative border-l border-gray-200 space-y-6 ml-3">
      {entries.map((entry) => (
        <li key={entry.id} className="ml-6">
          <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-white border-2 border-gray-300 rounded-full">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
          </span>
          <div className="p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              {entry.estadoAnterior && (
                <>
                  <StatusBadge status={entry.estadoAnterior} />
                  <span className="text-gray-400 text-xs">→</span>
                </>
              )}
              <StatusBadge status={entry.estadoNuevo} />
            </div>
            <p className="text-xs text-gray-500">
              {new Date(entry.creadoEn).toLocaleString('es-CO')} · {entry.cambiadoPor}
            </p>
            {entry.notas && <p className="text-sm text-gray-700 mt-1 italic">"{entry.notas}"</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
