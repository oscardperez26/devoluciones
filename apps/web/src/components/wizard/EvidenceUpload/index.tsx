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
      <div className="mt-2 space-y-2">
        <p className="text-sm text-green-600 font-medium">✓ Foto subida correctamente</p>
        <button
          type="button"
          onClick={onUploaded}
          className="w-full bg-[#111827] text-white text-sm font-semibold rounded-xl py-2.5 transition-colors hover:bg-gray-800"
        >
          Confirmar y continuar →
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <div
        className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center cursor-pointer hover:border-gray-400 transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <p className="text-sm text-gray-500 animate-pulse">Subiendo foto...</p>
        ) : (
          <>
            <p className="text-2xl mb-1">📷</p>
            <p className="text-sm font-medium text-gray-700">Haz clic para subir la foto</p>
            <p className="text-xs text-gray-400 mt-1">JPEG, PNG o WebP · Máx. 10 MB</p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) void handleFile(e.target.files[0]); }}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
