import './StatusTimeline.css';
import type { StatusHistory } from '@/types';
import StatusBadge from './StatusBadge';

export default function StatusTimeline({ entries }: { entries: StatusHistory[] }) {
  return (
    <ol className="timeline">
      {entries.map((entry) => (
        <li key={entry.id} className="timeline-entry">
          <span className="timeline-dot">
            <span className="timeline-dot-inner" />
          </span>
          <div className="timeline-card">
            <div className="timeline-status-row">
              {entry.estadoAnterior && (
                <>
                  <StatusBadge status={entry.estadoAnterior} />
                  <span className="timeline-arrow">→</span>
                </>
              )}
              <StatusBadge status={entry.estadoNuevo} />
            </div>
            <p className="timeline-meta">
              {new Date(entry.creadoEn).toLocaleString('es-CO')} · {entry.cambiadoPor}
            </p>
            {entry.notas && <p className="timeline-note">"{entry.notas}"</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
