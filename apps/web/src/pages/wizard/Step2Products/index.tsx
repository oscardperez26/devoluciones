import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSessionOrder } from '@/api/orders.api';
import { createOrUpdateDraft } from '@/api/returns.api';
import { ErrorMessage, PrimaryButton, WizardPage } from '@/components/ui';
import EvidenceUpload from '@/components/wizard/EvidenceUpload';
import StepIndicator from '@/components/wizard/StepIndicator';
import type { SelectedItem } from '@/store/wizard.store';
import { useWizardStore } from '@/store/wizard.store';
import type { EligibleReason, OrderItem } from '@/types';

const BLOCKED_LABELS: Record<string, { text: string; icon: string }> = {
  ACTIVE_RETURN:    { icon: '🔄', text: 'Ya tiene una solicitud de devolución en proceso.' },
  ALREADY_REFUNDED: { icon: '✅', text: 'Este producto ya fue reembolsado anteriormente.' },
  NOT_RETURNABLE:   { icon: '🚫', text: 'Este producto no es elegible para devolución.' },
};

const GROUP_ORDER = ['Talla y expectativa', 'Entrega y despacho', 'Calidad del producto'];

type Phase = 'selecting' | 'evidence';

function groupReasons(reasons: EligibleReason[]): { grupo: string; items: EligibleReason[] }[] {
  const map = new Map<string, EligibleReason[]>();
  for (const r of reasons) {
    const g = r.grupo ?? 'Otros';
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(r);
  }
  const ordered: { grupo: string; items: EligibleReason[] }[] = [];
  for (const g of GROUP_ORDER) {
    if (map.has(g)) ordered.push({ grupo: g, items: map.get(g)! });
  }
  for (const [g, items] of map) {
    if (!GROUP_ORDER.includes(g)) ordered.push({ grupo: g, items });
  }
  return ordered;
}

function ReasonPicker({
  reasons,
  selected,
  onSelect,
}: {
  reasons: EligibleReason[];
  selected: string;
  onSelect: (code: string) => void;
}) {
  const groups = groupReasons(reasons);
  const selectedReason = reasons.find((r) => r.code === selected);
  const [openGroup, setOpenGroup] = useState<string | null>(
    selectedReason ? (selectedReason.grupo ?? null) : null,
  );

  if (reasons.length === 0) {
    return <p className="text-xs text-orange-600 py-1">No hay motivos disponibles para este producto (plazo vencido).</p>;
  }

  function toggleGroup(grupo: string) {
    setOpenGroup((prev) => (prev === grupo ? null : grupo));
  }

  return (
    <div className="space-y-1.5">
      {groups.map(({ grupo, items }) => {
        const isOpen = openGroup === grupo;
        const groupSelected = items.find((r) => r.code === selected);

        return (
          <div key={grupo} className={`rounded-xl border overflow-hidden transition-colors ${isOpen ? 'border-[#111827]' : 'border-gray-200'}`}>
            {/* Header del grupo */}
            <button
              type="button"
              onClick={() => toggleGroup(grupo)}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors ${isOpen ? 'bg-[#111827] text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-medium truncate">{grupo}</span>
                {groupSelected && !isOpen && (
                  <span className="text-xs bg-white/20 text-white bg-opacity-20 px-2 py-0.5 rounded-full truncate max-w-[140px]" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                    ✓ {groupSelected.label}
                  </span>
                )}
                {groupSelected && !isOpen && (
                  <span className="hidden" />
                )}
              </div>
              <span className={`text-xs flex-shrink-0 ml-2 ${isOpen ? 'text-gray-300' : 'text-gray-400'}`}>
                {isOpen ? '▲' : '▼'}
              </span>
            </button>

            {/* Opciones desplegables */}
            {isOpen && (
              <div className="divide-y divide-gray-100">
                {items.map((r) => {
                  const isSelected = r.code === selected;
                  return (
                    <button
                      key={r.code}
                      type="button"
                      onClick={() => { onSelect(r.code); setOpenGroup(null); }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
                        isSelected ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${isSelected ? 'border-[#111827] bg-[#111827]' : 'border-gray-300'}`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="text-sm text-gray-700">{r.label}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        {r.requiresEvidence && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">📷</span>
                        )}
                        <span className="text-xs text-gray-400">{r.daysLeft}d</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Motivo seleccionado visible cuando el grupo está cerrado */}
            {groupSelected && !isOpen && (
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#111827] flex-shrink-0" />
                <span className="text-xs text-gray-700 truncate">{groupSelected.label}</span>
                {groupSelected.requiresEvidence && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full flex-shrink-0">📷</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Step2Products() {
  const navigate = useNavigate();
  const { returnId, setReturnId, setViewReturnId, goToStep } = useWizardStore();
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
        return { ...s, reasonCodes: s.reasonCodes[0] === code ? [] : [code] };
      }),
    );
  }

  function handleViewBlockedReturn(item: OrderItem) {
    if (!item.blockingReturnId) return;
    setViewReturnId(item.blockingReturnId);
    navigate('/estado');
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
    <WizardPage>
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
                      blocked ? 'border-gray-100' : isSelected ? 'border-[#111827]' : 'border-transparent'
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
                          {!blocked && (
                            <div className={`w-5 h-5 mt-0.5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-[#111827] border-[#111827]' : 'border-gray-300'
                            }`}>
                              {isSelected && <span className="text-white text-xs">✓</span>}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className={`font-medium text-sm ${blocked ? 'text-gray-500' : ''}`}>{item.productName}</p>
                            <p className="text-xs text-gray-500">{item.sku}{item.size && ` · Talla ${item.size}`}{item.color && ` · Color ${item.color}`}</p>
                            <p className="text-sm font-semibold mt-1">${item.unitPrice.toLocaleString('es-CO')}</p>
                            {blocked && (() => {
                              const bl = BLOCKED_LABELS[item.blockedReason ?? ''];
                              return (
                                <div className="mt-2">
                                  <p className="text-xs text-amber-600 flex items-center gap-1">
                                    <span>{bl?.icon ?? '🚫'}</span>
                                    <span>{bl?.text ?? 'No disponible para devolución.'}</span>
                                  </p>
                                  {item.blockingReturnId && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleViewBlockedReturn(item); }}
                                      className="mt-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium underline"
                                    >
                                      Ver estado de esta devolución →
                                    </button>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {isSelected && sel && (
                      <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                        <p className="text-xs font-medium text-gray-700 mb-3">Motivo de devolución:</p>
                        <ReasonPicker
                          reasons={item.eligibleReasons}
                          selected={sel.reasonCodes[0] ?? ''}
                          onSelect={(code) => selectReason(item.id, code)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {error && <ErrorMessage message={error} />}

            <div className="mt-6">
              <PrimaryButton disabled={saving} onClick={() => { void saveDraft(); }}>
                {saving ? 'Guardando...' : 'Guardar ítems →'}
              </PrimaryButton>
            </div>
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
                        <p className="text-xs text-gray-500">Motivo: {s.reasonCodes.join(', ')}</p>
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
    </WizardPage>
  );
}
