import './EvidenceUpload.css';
import { useRef, useState } from 'react';
import { uploadEvidenceDirect } from '@/api/returns.api';

interface Props {
  returnId: string;
  devolucionItemId: string;
  onUploaded: () => void;
}

interface PhotoEntry {
  id: string;
  previewUrl: string;
  status: 'uploading' | 'done' | 'error';
}

const MAX_PHOTOS = 3;

export default function EvidenceUpload({ returnId, devolucionItemId, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [globalError, setGlobalError] = useState('');

  const doneCount = photos.filter((p) => p.status === 'done').length;
  const anyUploading = photos.some((p) => p.status === 'uploading');
  const canAddMore = photos.length < MAX_PHOTOS;
  const canConfirm = doneCount > 0 && !anyUploading;

  async function handleFile(file: File) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setGlobalError('Solo se permiten imágenes JPEG, PNG o WebP.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setGlobalError('El archivo supera el límite de 10 MB.');
      return;
    }
    if (photos.length >= MAX_PHOTOS) return;

    setGlobalError('');
    const id = crypto.randomUUID();
    const previewUrl = URL.createObjectURL(file);

    setPhotos((prev) => [...prev, { id, previewUrl, status: 'uploading' }]);

    try {
      await uploadEvidenceDirect(returnId, devolucionItemId, file);
      setPhotos((prev) => prev.map((p) => p.id === id ? { ...p, status: 'done' } : p));
    } catch {
      setPhotos((prev) => prev.map((p) => p.id === id ? { ...p, status: 'error' } : p));
    }
  }

  function removePhoto(id: string) {
    setPhotos((prev) => {
      const entry = prev.find((p) => p.id === id);
      if (entry) URL.revokeObjectURL(entry.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  function retryPhoto(id: string) {
    // Remove the failed entry so the user can re-pick the file
    removePhoto(id);
  }

  return (
    <div className="ev-upload">
      {/* Grid de previews */}
      {photos.length > 0 && (
        <div className="ev-preview-grid">
          {photos.map((p) => (
            <div key={p.id} className={`ev-thumb-wrap ev-thumb-wrap--${p.status}`}>
              <img src={p.previewUrl} alt="Evidencia" className="ev-thumb-img" />

              {p.status === 'uploading' && (
                <div className="ev-thumb-overlay">
                  <div className="ev-thumb-spinner" />
                </div>
              )}

              {p.status === 'done' && (
                <div className="ev-thumb-overlay ev-thumb-overlay--done">
                  <svg viewBox="0 0 24 24" fill="none" className="ev-thumb-check">
                    <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}

              {p.status === 'error' && (
                <div className="ev-thumb-overlay ev-thumb-overlay--error">
                  <button
                    type="button"
                    className="ev-thumb-retry"
                    onClick={() => retryPhoto(p.id)}
                    title="Eliminar y volver a subir"
                  >
                    ✕
                  </button>
                </div>
              )}

              {p.status !== 'uploading' && (
                <button
                  type="button"
                  className="ev-thumb-remove"
                  onClick={() => removePhoto(p.id)}
                  aria-label="Eliminar foto"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          {/* Celda «+» para añadir más */}
          {canAddMore && (
            <button
              type="button"
              className="ev-add-more"
              onClick={() => inputRef.current?.click()}
              aria-label="Añadir foto"
            >
              <span className="ev-add-icon">+</span>
              <span className="ev-add-label">Añadir</span>
            </button>
          )}
        </div>
      )}

      {/* Zona de drop inicial (solo cuando no hay fotos aún) */}
      {photos.length === 0 && (
        <div className="ev-zone" onClick={() => inputRef.current?.click()}>
          <p className="ev-zone-icon">📷</p>
          <p className="ev-zone-label">Haz clic para subir fotos</p>
          <p className="ev-zone-hint">Hasta {MAX_PHOTOS} imágenes · JPEG, PNG o WebP · Máx. 10 MB c/u</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="ev-file-input"
        onChange={(e) => {
          if (e.target.files?.[0]) void handleFile(e.target.files[0]);
          e.target.value = '';
        }}
      />

      {globalError && <p className="ev-error">{globalError}</p>}

      {/* Contador */}
      {photos.length > 0 && (
        <p className="ev-counter">
          {doneCount}/{MAX_PHOTOS} foto{doneCount !== 1 ? 's' : ''} subida{doneCount !== 1 ? 's' : ''}
          {canAddMore && !anyUploading && <span className="ev-counter-hint"> · puedes agregar {MAX_PHOTOS - photos.length} más</span>}
        </p>
      )}

      {/* Botón confirmar */}
      {canConfirm && (
        <button type="button" onClick={onUploaded} className="ev-confirm-btn">
          Confirmar y continuar →
        </button>
      )}
    </div>
  );
}
