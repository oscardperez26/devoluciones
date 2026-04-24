import { useEffect, useState } from 'react';
import {
  createReturnRule,
  listReturnRules,
  updateReturnRule,
  type ReturnRule,
} from '@/api/admin.api';

const GRUPOS = ['Talla y expectativa', 'Entrega y despacho', 'Calidad del producto'];

const EMPTY_NEW: Omit<ReturnRule, 'id'> = {
  codigo: '',
  label: '',
  grupo: GRUPOS[0],
  plazosDias: 5,
  requiereEvidencia: false,
  activo: true,
  orden: 0,
};

export default function ReturnRules() {
  const [rules, setRules] = useState<ReturnRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<ReturnRule>>({});
  const [showNew, setShowNew] = useState(false);
  const [newDraft, setNewDraft] = useState<Omit<ReturnRule, 'id'>>(EMPTY_NEW);
  const [error, setError] = useState('');

  useEffect(() => {
    listReturnRules()
      .then(setRules)
      .catch(() => setError('No se pudieron cargar las reglas.'))
      .finally(() => setLoading(false));
  }, []);

  const grouped = GRUPOS.map((g) => ({
    grupo: g,
    rules: rules.filter((r) => r.grupo === g),
  })).filter((g) => g.rules.length > 0);

  const ungrouped = rules.filter((r) => !GRUPOS.includes(r.grupo));
  const allGroups = [
    ...grouped,
    ...(ungrouped.length > 0 ? [{ grupo: 'Otros', rules: ungrouped }] : []),
  ];

  async function handleToggle(rule: ReturnRule, field: 'activo' | 'requiereEvidencia') {
    setSaving(rule.id + field);
    try {
      const updated = await updateReturnRule(rule.id, { [field]: !rule[field] });
      setRules((prev) => prev.map((r) => (r.id === rule.id ? updated : r)));
    } catch {
      setError('Error al guardar.');
    } finally {
      setSaving(null);
    }
  }

  function startEdit(rule: ReturnRule) {
    setEditingId(rule.id);
    setEditDraft({ label: rule.label, plazosDias: rule.plazosDias, grupo: rule.grupo, orden: rule.orden });
  }

  async function saveEdit(id: string) {
    setSaving(id);
    try {
      const updated = await updateReturnRule(id, editDraft);
      setRules((prev) => prev.map((r) => (r.id === id ? updated : r)));
      setEditingId(null);
    } catch {
      setError('Error al guardar.');
    } finally {
      setSaving(null);
    }
  }

  async function handleCreate() {
    if (!newDraft.codigo.trim() || !newDraft.label.trim()) {
      setError('Código y nombre son obligatorios.');
      return;
    }
    setSaving('new');
    try {
      const created = await createReturnRule(newDraft);
      setRules((prev) => [...prev, created]);
      setShowNew(false);
      setNewDraft(EMPTY_NEW);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Error al crear la regla.');
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-gray-400 animate-pulse">Cargando reglas...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#111827]">Reglas de devolución</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configura motivos, plazos y requisitos de evidencia.</p>
        </div>
        <button
          onClick={() => { setShowNew(true); setError(''); }}
          className="bg-[#111827] hover:bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          + Nueva regla
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex justify-between">
          {error}
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 ml-4">✕</button>
        </div>
      )}

      {/* Formulario nueva regla */}
      {showNew && (
        <div className="mb-6 bg-white rounded-2xl shadow-sm border border-blue-200 p-5">
          <h2 className="text-sm font-semibold text-[#111827] mb-4">Nueva regla</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Código (único, mayúsculas)</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono"
                placeholder="EJEMPLO_MOTIVO"
                value={newDraft.codigo}
                onChange={(e) => setNewDraft((d) => ({ ...d, codigo: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') }))}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nombre visible</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Descripción del motivo"
                value={newDraft.label}
                onChange={(e) => setNewDraft((d) => ({ ...d, label: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Grupo</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={newDraft.grupo}
                onChange={(e) => setNewDraft((d) => ({ ...d, grupo: e.target.value }))}
              >
                {GRUPOS.map((g) => <option key={g}>{g}</option>)}
                <option value="Otros">Otros</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Plazo (días)</label>
              <input
                type="number" min={1} max={365}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={newDraft.plazosDias}
                onChange={(e) => setNewDraft((d) => ({ ...d, plazosDias: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Orden</label>
              <input
                type="number" min={0}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={newDraft.orden}
                onChange={(e) => setNewDraft((d) => ({ ...d, orden: Number(e.target.value) }))}
              />
            </div>
            <div className="flex items-center gap-3 pt-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={newDraft.requiereEvidencia}
                  onChange={(e) => setNewDraft((d) => ({ ...d, requiereEvidencia: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
                Requiere evidencia
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleCreate}
              disabled={saving === 'new'}
              className="bg-[#111827] hover:bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
            >
              {saving === 'new' ? 'Guardando...' : 'Crear regla'}
            </button>
            <button
              onClick={() => { setShowNew(false); setNewDraft(EMPTY_NEW); setError(''); }}
              className="border border-gray-200 text-gray-600 text-sm font-semibold px-4 py-2 rounded-xl hover:border-gray-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Reglas agrupadas */}
      <div className="space-y-6">
        {allGroups.map(({ grupo, rules: groupRules }) => (
          <div key={grupo} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{grupo}</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {groupRules.map((rule) => (
                <RuleRow
                  key={rule.id}
                  rule={rule}
                  isEditing={editingId === rule.id}
                  draft={editDraft}
                  saving={saving}
                  onToggle={handleToggle}
                  onStartEdit={startEdit}
                  onDraftChange={setEditDraft}
                  onSaveEdit={saveEdit}
                  onCancelEdit={() => setEditingId(null)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface RuleRowProps {
  rule: ReturnRule;
  isEditing: boolean;
  draft: Partial<ReturnRule>;
  saving: string | null;
  onToggle: (rule: ReturnRule, field: 'activo' | 'requiereEvidencia') => void;
  onStartEdit: (rule: ReturnRule) => void;
  onDraftChange: (d: Partial<ReturnRule>) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
}

function RuleRow({ rule, isEditing, draft, saving, onToggle, onStartEdit, onDraftChange, onSaveEdit, onCancelEdit }: RuleRowProps) {
  if (isEditing) {
    return (
      <div className="px-5 py-4 bg-blue-50/40">
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Nombre</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
              value={draft.label ?? ''}
              onChange={(e) => onDraftChange({ ...draft, label: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Grupo</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
              value={draft.grupo ?? rule.grupo}
              onChange={(e) => onDraftChange({ ...draft, grupo: e.target.value })}
            >
              {GRUPOS.map((g) => <option key={g}>{g}</option>)}
              <option value="Otros">Otros</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Plazo (días)</label>
            <input
              type="number" min={1} max={365}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
              value={draft.plazosDias ?? rule.plazosDias}
              onChange={(e) => onDraftChange({ ...draft, plazosDias: Number(e.target.value) })}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onSaveEdit(rule.id)}
            disabled={saving === rule.id}
            className="bg-[#111827] hover:bg-gray-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving === rule.id ? 'Guardando...' : 'Guardar'}
          </button>
          <button
            onClick={onCancelEdit}
            className="border border-gray-200 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-lg hover:border-gray-300 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
      {/* Toggle activo */}
      <button
        onClick={() => onToggle(rule, 'activo')}
        disabled={!!saving}
        title={rule.activo ? 'Desactivar' : 'Activar'}
        className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 focus:outline-none ${
          rule.activo ? 'bg-[#111827]' : 'bg-gray-200'
        } disabled:opacity-50`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${rule.activo ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>

      {/* Nombre + código */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${rule.activo ? 'text-[#111827]' : 'text-gray-400'}`}>
          {rule.label}
          {!rule.activo && <span className="ml-2 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Inactivo</span>}
        </p>
        <p className="text-xs text-gray-400 font-mono mt-0.5">{rule.codigo}</p>
      </div>

      {/* Plazo */}
      <div className="text-center flex-shrink-0 w-16">
        <p className="text-sm font-semibold text-[#111827]">{rule.plazosDias}d</p>
        <p className="text-xs text-gray-400">plazo</p>
      </div>

      {/* Toggle evidencia */}
      <button
        onClick={() => onToggle(rule, 'requiereEvidencia')}
        disabled={!!saving}
        className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors flex-shrink-0 disabled:opacity-50 ${
          rule.requiereEvidencia
            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
      >
        {rule.requiereEvidencia ? '📷 Con evidencia' : 'Sin evidencia'}
      </button>

      {/* Editar */}
      <button
        onClick={() => onStartEdit(rule)}
        className="text-xs text-gray-400 hover:text-gray-700 flex-shrink-0 transition-colors"
      >
        Editar
      </button>
    </div>
  );
}
