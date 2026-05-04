import './Step3Agreement.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSessionOrder } from '@/api/orders.api';
import StepIndicator from '@/components/wizard/StepIndicator';
import { useWizardStore } from '@/store/wizard.store';

export default function Step3Agreement() {
  const navigate = useNavigate();
  const { selectedItems, goToStep } = useWizardStore();
  const [accepted, setAccepted] = useState(false);

  const { data } = useQuery({
    queryKey: ['session-order'],
    queryFn: getSessionOrder,
  });

  const enriched = selectedItems.map((s) => {
    const orderItem = data?.items.find((i) => i.id === s.orderItemId);
    const reasonLabel =
      orderItem?.eligibleReasons.find((r) => r.code === s.reasonCodes[0])?.label ??
      s.reasonCodes[0] ??
      '—';
    return { ...s, orderItem, reasonLabel };
  });

  const total = enriched.reduce(
    (sum, s) => sum + (s.orderItem?.unitPrice ?? 0) * s.quantity,
    0,
  );

  return (
    <div className="s3-root">

      {/* ── Header fijo ── */}
      <header className="s3-header">
        <div className="s3-header-inner">
          <StepIndicator current={3} />
        </div>
      </header>

      {/* ── Contenido scrolleable ── */}
      <main className="s3-body">

        <div className="s3-title-block">
          <h2 className="s3-title">Resumen de tu devolución</h2>
          <p className="s3-subtitle">Revisa los productos y acepta los términos para continuar.</p>
        </div>

        {/* Tarjetas de producto con foto */}
        <div className="s3-items">
          {enriched.map((s) => (
            <div key={s.orderItemId} className="s3-item">
              {/* Foto */}
              <div className="s3-item-img-wrap">
                {s.orderItem?.imageUrl ? (
                  <img
                    src={s.orderItem.imageUrl}
                    alt={s.productName}
                    className="s3-item-img"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="s3-item-img-ph">👕</div>
                )}
              </div>

              {/* Info */}
              <div className="s3-item-info">
                <p className="s3-item-name">{s.productName ?? s.orderItemId}</p>
                <div className="s3-item-tags">
                  {s.orderItem?.size  && <span className="s3-tag">T. {s.orderItem.size}</span>}
                  {s.orderItem?.color && <span className="s3-tag s3-tag--color">C. {s.orderItem.color}</span>}
                </div>
                <p className="s3-item-reason">{s.reasonLabel}</p>
              </div>

              {/* Precio + cantidad */}
              <div className="s3-item-right">
                {s.orderItem && (
                  <p className="s3-item-price">
                    ${(s.orderItem.unitPrice * s.quantity).toLocaleString('es-CO')}
                  </p>
                )}
                <span className="s3-item-qty">×{s.quantity}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        {total > 0 && (
          <div className="s3-total-row">
            <span className="s3-total-label">Total a reembolsar</span>
            <span className="s3-total-value">${total.toLocaleString('es-CO')}</span>
          </div>
        )}

        {/* Condiciones */}
        <div className="s3-conditions">
          <p className="s3-conditions-title">Condiciones de devolución</p>
          <ul className="s3-conditions-list">
            <li>El producto debe estar sin usar, con etiquetas originales.</li>
            <li>El reembolso se procesa una vez recibamos el producto.</li>
            <li>Los plazos de reembolso dependen del método seleccionado.</li>
          </ul>
        </div>

        {/* Checkbox aceptar */}
        <label className="s3-accept">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="s3-accept-cb"
          />
          <span className="s3-accept-text">
            Acepto las condiciones de devolución y confirmo que la información es correcta.
          </span>
        </label>

      </main>

      {/* ── Barra inferior fija ── */}
      <div className="s3-action-bar">
        <div className="s3-action-inner">
          <button
            type="button"
            className="s3-back-btn"
            onClick={() => navigate('/paso-2')}
          >
            <svg viewBox="0 0 20 20" fill="none" className="s3-back-svg">
              <path d="M12 15l-5-5 5-5" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Volver
          </button>

          <div className="s3-action-info">
            {accepted
              ? <span className="s3-action-ready">✓ Listo para continuar</span>
              : <span className="s3-action-hint">Acepta los términos para continuar</span>
            }
          </div>

          <button
            type="button"
            disabled={!accepted}
            className="s3-continue-btn"
            onClick={() => { goToStep(4); navigate('/paso-4'); }}
          >
            Continuar →
          </button>
        </div>
      </div>

    </div>
  );
}
