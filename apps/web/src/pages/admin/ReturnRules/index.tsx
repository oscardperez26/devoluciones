import './ReturnRules.css';
import { useEffect, useState } from 'react';
import {
  createReturnRule,
  listReturnRules,
  updateReturnRule,
  type ReturnRule,
} from '@/api/admin.api';
import { AdminButton, AdminErrorAlert, AdminSecondaryButton } from '@/components/admin/ui';

const GRUPOS = ['Talla y expectativa', 'Entrega y despacho', 'Calidad del producto'];

const EMPTY_NEW: Omit<ReturnRule, 'id'> = {
  codigo: '', label: '', grupo: GRUPOS[0],
  plazosDias: 5, requiereEvidencia: false, activo: true, orden: 0,
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
      <div className="rules-page">
        <p style={{ color: '#9ca3af' }}>Cargando reglas...</p>
      </div>
    );
  }

  return (
    <div className="rules-page">
      <div className="rules-header">
        <div className="rules-header-text">
          <h1>Reglas de devolución</h1>
          <p>Configura motivos, plazos y requisitos de evidencia.</p>
        </div>
        <AdminButton onClick={() => { setShowNew(true); setError(''); }}>
          + Nueva regla
        </AdminButton>
      </div>

      <AdminErrorAlert message={error} onDismiss={() => setError('')} />

      {/* Formulario nueva regla */}
      {showNew && (
        <div className="new-rule-form">
          <h2 className="new-rule-title">Nueva regla</h2>
          <div className="new-rule-grid">
            <div className="form-field">
              <label className="form-label">Código (único, mayúsculas)</label>
              <input
                className="form-input form-input--mono"
                placeholder="EJEMPLO_MOTIVO"
                value={newDraft.codigo}
                onChange={(e) => setNewDraft((d) => ({ ...d, codigo: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') }))}
              />
            </div>
            <div className="form-field">
              <label className="form-label">Nombre visible</label>
              <input
                className="form-input"
                placeholder="Descripción del motivo"
                value={newDraft.label}
                onChange={(e) => setNewDraft((d) => ({ ...d, label: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label className="form-label">Grupo</label>
              <select
                className="form-select"
                value={newDraft.grupo}
                onChange={(e) => setNewDraft((d) => ({ ...d, grupo: e.target.value }))}
              >
                {GRUPOS.map((g) => <option key={g}>{g}</option>)}
                <option value="Otros">Otros</option>
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Plazo (días)</label>
              <input
                type="number" min={1} max={365}
                className="form-input"
                value={newDraft.plazosDias}
                onChange={(e) => setNewDraft((d) => ({ ...d, plazosDias: Number(e.target.value) }))}
              />
            </div>
            <div className="form-field">
              <label className="form-label">Orden</label>
              <input
                type="number" min={0}
                className="form-input"
                value={newDraft.orden}
                onChange={(e) => setNewDraft((d) => ({ ...d, orden: Number(e.target.value) }))}
              />
            </div>
            <div className="form-checkbox-row">
              <label className="form-checkbox-label">
                <input
                  type="checkbox"
                  checked={newDraft.requiereEvidencia}
                  onChange={(e) => setNewDraft((d) => ({ ...d, requiereEvidencia: e.target.checked }))}
                />
                Requiere evidencia
              </label>
            </div>
          </div>
          <div className="form-actions">
            <AdminButton onClick={handleCreate} disabled={saving === 'new'}>
              {saving === 'new' ? 'Guardando...' : 'Crear regla'}
            </AdminButton>
            <AdminSecondaryButton onClick={() => { setShowNew(false); setNewDraft(EMPTY_NEW); setError(''); }}>
              Cancelar
            </AdminSecondaryButton>
          </div>
        </div>
      )}

      {/* Reglas agrupadas */}
      <div className="rule-groups">
        {allGroups.map(({ grupo, rules: groupRules }) => (
          <div key={grupo} className="rule-group">
            <div className="rule-group-header">
              <h2>{grupo}</h2>
            </div>
            <div>
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
      <div className="rule-row--editing">
        <div className="rule-edit-grid">
          <div className="form-field">
            <label className="form-label">Nombre</label>
            <input
              className="form-input form-input--compact"
              value={draft.label ?? ''}
              onChange={(e) => onDraftChange({ ...draft, label: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label className="form-label">Grupo</label>
            <select
              className="form-select form-select--compact"
              value={draft.grupo ?? rule.grupo}
              onChange={(e) => onDraftChange({ ...draft, grupo: e.target.value })}
            >
              {GRUPOS.map((g) => <option key={g}>{g}</option>)}
              <option value="Otros">Otros</option>
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Plazo (días)</label>
            <input
              type="number" min={1} max={365}
              className="form-input form-input--compact"
              value={draft.plazosDias ?? rule.plazosDias}
              onChange={(e) => onDraftChange({ ...draft, plazosDias: Number(e.target.value) })}
            />
          </div>
        </div>
        <div className="rule-edit-actions">
          <AdminButton onClick={() => onSaveEdit(rule.id)} disabled={saving === rule.id} className="btn-sm">
            {saving === rule.id ? 'Guardando...' : 'Guardar'}
          </AdminButton>
          <AdminSecondaryButton onClick={onCancelEdit} className="btn-sm">
            Cancelar
          </AdminSecondaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="rule-row">
      <button
        onClick={() => onToggle(rule, 'activo')}
        disabled={!!saving}
        title={rule.activo ? 'Desactivar' : 'Activar'}
        className={`toggle ${rule.activo ? 'toggle--on' : 'toggle--off'}`}
      >
        <span className="toggle__knob" />
      </button>

      <div className="rule-info">
        <p className={`rule-name ${rule.activo ? 'rule-name--active' : 'rule-name--inactive'}`}>
          {rule.label}
          {!rule.activo && <span className="rule-inactive-badge">Inactivo</span>}
        </p>
        <p className="rule-code">{rule.codigo}</p>
      </div>

      <div className="rule-plazo">
        <p className="rule-plazo-value">{rule.plazosDias}d</p>
        <p className="rule-plazo-label">plazo</p>
      </div>

      <button
        onClick={() => onToggle(rule, 'requiereEvidencia')}
        disabled={!!saving}
        className={`evidence-toggle ${rule.requiereEvidencia ? 'evidence-toggle--on' : 'evidence-toggle--off'}`}
      >
        {rule.requiereEvidencia ? '📷 Con evidencia' : 'Sin evidencia'}
      </button>

      <button onClick={() => onStartEdit(rule)} className="edit-btn">
        Editar
      </button>
    </div>
  );
}
