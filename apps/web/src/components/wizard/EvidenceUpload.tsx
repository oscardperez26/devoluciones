import { useRef, useState } from 'react';
import { confirmUpload, getUploadUrl, uploadFileToS3 } from '@/api/returns.api';

interface Props {
  returnId: string;
  devolucionItemId: string;
  onUploaded: () => void;
}

export default function EvidenceUpload({ returnId, devolucionItemId, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [count, setCount] = useState(0);
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
      const { uploadUrl, fileKey } = await getUploadUrl(returnId, devolucionItemId, file);
      await uploadFileToS3(uploadUrl, file);
      await confirmUpload(returnId, devolucionItemId, fileKey, file);
      const next = count + 1;
      setCount(next);
      if (next >= 5) onUploaded();
    } catch {
      setError('Error al subir la imagen. Intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mt-2">
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <p className="text-sm text-gray-500">Subiendo...</p>
        ) : (
          <>
            <p className="text-sm text-gray-600">Haz clic para subir una foto</p>
            <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP · Máx. 10 MB · {count}/5 subidas</p>
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
      {count > 0 && !error && (
        <p className="text-xs text-green-600 mt-1">✓ {count} foto(s) subida(s)</p>
      )}
      {count > 0 && (
        <button
          type="button"
          onClick={onUploaded}
          className="mt-2 text-xs text-gray-500 underline"
        >
          Continuar sin subir más
        </button>
      )}
    </div>
  );
}
