import './EvidenceUpload.css';
import { useRef, useState } from 'react';
import { uploadEvidenceDirect } from '@/api/returns.api';

interface Props {
  returnId: string;
  devolucionItemId: string;
  onUploaded: () => void;
}

export default function EvidenceUpload({ returnId, devolucionItemId, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(file: File) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Solo se permiten imágenes JPEG, PNG o WebP.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo supera el límite de 10 MB.');
      return;
    }
    setError('');
    setUploading(true);
    try {
      await uploadEvidenceDirect(returnId, devolucionItemId, file);
      setUploaded(true);
    } catch {
      setError('Error al subir la imagen. Intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  }

  if (uploaded) {
    return (
      <div className="upload-success">
        <p className="upload-success-text">✓ Foto subida correctamente</p>
        <button type="button" onClick={onUploaded} className="upload-confirm-btn">
          Confirmar y continuar →
        </button>
      </div>
    );
  }

  return (
    <div className="evidence-upload">
      <div className="upload-zone" onClick={() => inputRef.current?.click()}>
        {uploading ? (
          <p className="upload-loading">Subiendo foto...</p>
        ) : (
          <>
            <p className="upload-icon">📷</p>
            <p className="upload-label">Haz clic para subir la foto</p>
            <p className="upload-hint">JPEG, PNG o WebP · Máx. 10 MB</p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="upload-file-input"
        onChange={(e) => { if (e.target.files?.[0]) void handleFile(e.target.files[0]); }}
      />
      {error && <p className="upload-error">{error}</p>}
    </div>
  );
}
