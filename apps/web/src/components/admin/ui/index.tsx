import './AdminUI.css';
import type { ReactNode } from 'react';

// ── Cards ─────────────────────────────────────────────────────────────────────

interface AdminCardProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function AdminCard({ children, className, noPadding }: AdminCardProps) {
  const cls = ['admin-card', noPadding ? 'no-padding' : '', className ?? ''].filter(Boolean).join(' ');
  return <div className={cls}>{children}</div>;
}

export function AdminSectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="section-title">{children}</h2>;
}

// ── Formulario ────────────────────────────────────────────────────────────────

interface AdminInputProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function AdminInput({ label, value, onChange, type = 'text', placeholder, required, className }: AdminInputProps) {
  const inputEl = (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className={['admin-input', className ?? ''].filter(Boolean).join(' ')}
    />
  );
  if (!label) return inputEl;
  return (
    <div className="admin-field">
      <label className="admin-label">{label}</label>
      {inputEl}
    </div>
  );
}

interface AdminSelectProps {
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
  className?: string;
}

export function AdminSelect({ value, onChange, children, className }: AdminSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={['admin-select', className ?? ''].filter(Boolean).join(' ')}
    >
      {children}
    </select>
  );
}

// ── Botones ───────────────────────────────────────────────────────────────────

interface AdminButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}

export function AdminButton({ children, onClick, disabled, type = 'button', className }: AdminButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={['btn-primary', className ?? ''].filter(Boolean).join(' ')}
    >
      {children}
    </button>
  );
}

export function AdminSecondaryButton({ children, onClick, disabled, type = 'button', className }: AdminButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={['btn-secondary', className ?? ''].filter(Boolean).join(' ')}
    >
      {children}
    </button>
  );
}

// ── Alertas ───────────────────────────────────────────────────────────────────

export function AdminErrorAlert({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  if (!message) return null;
  return (
    <div className="error-alert">
      <span>{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="error-alert__dismiss">✕</button>
      )}
    </div>
  );
}
