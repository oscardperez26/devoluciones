import './WizardUI.css';
import type { ReactNode } from 'react';

export function WizardPage({ children }: { children: ReactNode }) {
  return (
    <div className="wizard-page">
      <div className="wizard-container">{children}</div>
    </div>
  );
}

export function StepTitle({ children }: { children: ReactNode }) {
  return <h2 className="step-title">{children}</h2>;
}

export function StepSubtitle({ children }: { children: ReactNode }) {
  return <p className="step-subtitle">{children}</p>;
}

interface PrimaryButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}

export function PrimaryButton({ children, onClick, disabled, type = 'button' }: PrimaryButtonProps) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className="primary-btn">
      {children}
    </button>
  );
}

export function StepCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={['step-card', className ?? ''].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}

interface FormInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}

export function FormInput({ label, value, onChange, type = 'text', placeholder }: FormInputProps) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="form-input"
      />
    </div>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  if (!message) return null;
  return <p className="wizard-error">{message}</p>;
}
