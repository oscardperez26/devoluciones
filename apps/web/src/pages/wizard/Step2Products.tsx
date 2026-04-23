import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSessionOrder } from '@/api/orders.api';
import { createOrUpdateDraft } from '@/api/returns.api';
import EvidenceUpload from '@/components/wizard/EvidenceUpload';
import StepIndicator from '@/components/wizard/StepIndicator';
import type { SelectedItem } from '@/store/wizard.store';
import { useWizardStore } from '@/store/wizard.store';
import type { OrderItem } from '@/types';

const REASON_LABELS: Record<string, string> = {
  SIZE_SMALL: 'Demasiado pequeño',
  SIZE_LARGE: 'Demasiado grande',
  NOT_EXPECTED: 'No es lo que esperaba',
  LATE_DELIVERY: 'Retraso — ya no lo quiero',
  WRONG_ITEM: 'Se entregó artículo errado',
  SEAM_DEFECT: 'Defecto de costura',
  SHRUNK: 'Se encogió',
  COLOR_LOSS: 'Perdió el color',
};

const BLOCKED_LABELS: Record<string, { text: string; icon: string }> = {
  ACTIVE_RETURN:    { icon: '🔄', text: 'Ya tiene una solicitud de devolución en proceso.' },
  ALREADY_REFUNDED: { icon: '✅', text: 'Este producto ya fue reembolsado anteriormente.' },
  NOT_RETURNABLE:   { icon: '🚫', text: 'Este producto no es elegible para devolución.' },
};

type Phase = 'selecting' | 'evidence';

export default function Step2Products() {
  const navigate = useNavigate();
  const { returnId, setReturnId, goToStep } = useWizardStore();
  const [phase, setPhase] = useState<Phase>('selecting');
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [evidenceDone, setEvidenceDone] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['session-order'],
    queryFn: getSessionOrder,
  });

  function toggleItem(item: OrderItem) {
    setSelected((prev) => {
      const exists = prev.find((s) => s.orderItemId === item.id);
      if (exists) return prev.filter((s) => s.orderItemId !== item.id);
      return [...prev, { orderItemId: item.id, reasonCodes: [], comments: '', quantity: 1, productName: item.productName }];
    });
  }

  function selectReason(itemId: string, code: string) {
    setSelected((prev) =>
      prev.map((s) => {
        if (s.orderItemId !== itemId) return s;
        const alreadySelected = s.reasonCodes[0] === code;
        return { ...s, reasonCodes: alreadySelected ? [] : [code] };
      }),
    );
  }

  async function saveDraft() {
    if (selected.length === 0) { setError('Selecciona al menos un producto.'); return; }
    if (selected.some((s) => s.reasonCodes.length === 0)) { setError('Selecciona el motivo de devolución de cada producto.'); return; }
    setError('');
    setSaving(true);
    try {
      const draft = await createOrUpdateDraft(selected);
      const enriched: SelectedItem[] = draft.items.map((di, idx) => ({
        ...selected[idx],
        devolucionItemId: di.id,
        requiresEvidence: di.requiresEvidence,
      }));
      setReturnId(draft.returnId, enriched);
      const needsEvidence = enriched.some((s) => s.requiresEvidence);
      if (needsEvidence) {
        setSelected(enriched);
        setPhase('evidence');
      } else {
        goToStep(3);
        navigate('/paso-3');
      }
    } catch {
      setError('Error al guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  function handleEvidenceDone(itemId: string) {
    setEvidenceDone((prev) => {
      const next = new Set([...prev, itemId]);
      if (itemsNeedingEvidence.every((s) => next.has(s.devolucionItemId!))) {
        goToStep(3);
        navigate('/paso-3');
      }
      return next;
    });
  }

  const itemsNeedingEvidence = selected.filter((s) => s.requiresEvidence && s.devolucionItemId);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Cargando productos...</p></div>;

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <StepIndicator current={2} />

        {phase === 'selecting' ? (
          <>
            <h2 className="text-xl font-bold text-[#111827] mb-2">Selecciona los productos a devolver</h2>
            <p className="text-sm text-gray-500 mb-6">Marca los productos y elige el motivo de devolución.</p>

            <div className="space-y-4">
              {data?.items.map((item) => {
                const isSelected = selected.some((s) => s.orderItemId === item.id);
                const sel = selected.find((s) => s.orderItemId === item.id);
                const blocked = !item.isReturnable || !!item.blockedReason;

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl shadow-sm border-2 transition-colors ${
                      blocked ? 'border-gray-100 opacity-60' : isSelected ? 'border-[#111827]' : 'border-transparent'
                    }`}
                  >
                    <div
                      className={`p-4 flex gap-3 ${!blocked ? 'cursor-pointer' : ''}`}
                      onClick={() => { if (!blocked) toggleItem(item); }}
                    >
                      {/* Product image */}
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="w-16 h-16 object-cover rounded-xl flex-shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-xl flex-shrink-0 flex items-center justify-center">
                          <span className="text-2xl text-gray-300">👕</span>
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex gap-3 items-start">
                          <div className={`w-5 h-5 mt-0.5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-[#111827] border-[#111827]' : 'border-gray-300'
                          }`}>
                            {isSelected && <span className="text-white text-xs">✓</span>}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm">{item.productName}</p>
                            <p className="text-xs text-gray-500">{item.sku}{item.size && ` · Talla ${item.size}`}{item.color && ` · Color ${item.color}`}</p>
                            <p className="text-sm font-semibold mt-1">${item.unitPrice.toLocaleString('es-CO')}</p>
                            {blocked && (() => {
                              const bl = BLOCKED_LABELS[item.blockedReason ?? ''];
                              return (
                                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                  <span>{bl?.icon ?? '🚫'}</span>
                                  <span>{bl?.text ?? 'No disponible para devolución.'}</span>
                                </p>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {isSelected && sel && (
                      <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                        <p className="text-xs font-medium text-gray-700 mb-2">Motivo de devolución:</p>
                        <div className="flex flex-wrap gap-2">
                          {item.eligibleReasons.map((r) => (
                            <button
                              key={r.code}
                              type="button"
                              onClick={() => selectReason(item.id, r.code)}
                              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                                sel.reasonCodes[0] === r.code
                                  ? 'bg-[#111827] text-white border-[#111827]'
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'
                              }`}
                            >
                              {REASON_LABELS[r.code] ?? r.code}
                              {r.requiresEvidence && ' 📷'}
                              <span className="ml-1 text-gray-400">{r.daysLeft}d</span>
                            </button>
                          ))}
                        </div>
                        {item.eligibleReasons.length === 0 && (
                          <p className="text-xs text-orange-600">No hay causales disponibles para este producto.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

            <button
              onClick={() => { void saveDraft(); }}
              disabled={saving}
              className="w-full mt-6 bg-[#111827] hover:bg-gray-800 disabled:opacity-60 text-white font-semibold rounded-xl py-3 transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar ítems →'}
            </button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-[#111827] mb-2">Sube las evidencias fotográficas</h2>
            <p className="text-sm text-gray-500 mb-6">Algunos productos requieren fotos del defecto.</p>

            <div className="space-y-4">
              {itemsNeedingEvidence.map((s) => {
                const item = data?.items.find((i) => i.id === s.orderItemId);
                return (
                  <div key={s.devolucionItemId} className="bg-white rounded-2xl shadow-sm p-4">
                    <div className="flex gap-3 mb-3">
                      {item?.imageUrl ? (
                        <img src={item.imageUrl} alt={item.productName} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                          <span className="text-lg text-gray-300">👕</span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">{item?.productName ?? s.orderItemId}</p>
                        <p className="text-xs text-gray-500">Motivo: {s.reasonCodes.map((c) => REASON_LABELS[c] ?? c).join(', ')}</p>
                      </div>
                    </div>
                    {evidenceDone.has(s.devolucionItemId!) ? (
                      <p className="text-sm text-green-600 font-medium">✓ Foto subida correctamente</p>
                    ) : (
                      <EvidenceUpload
                        returnId={returnId!}
                        devolucionItemId={s.devolucionItemId!}
                        onUploaded={() => handleEvidenceDone(s.devolucionItemId!)}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-center text-gray-400 mt-6">Confirma la foto de cada producto para continuar.</p>
          </>
        )}
      </div>
    </div>
  );
}
