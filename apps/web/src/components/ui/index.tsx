/** Componentes UI reutilizables del wizard */

// ── Layout ────────────────────────────────────────────────────────────────────

export function WizardPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8 px-4">
      <div className="max-w-2xl mx-auto">{children}</div>
    </div>
  );
}

// ── Tipografía ────────────────────────────────────────────────────────────────

export function StepTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold text-[#111827] mb-2">{children}</h2>;
}

export function StepSubtitle({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-500 mb-6">{children}</p>;
}

// ── Botones ───────────────────────────────────────────────────────────────────

interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}

export function PrimaryButton({ children, onClick, disabled, type = 'button' }: PrimaryButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full bg-[#111827] hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 transition-colors"
    >
      {children}
    </button>
  );
}

// ── Cards ─────────────────────────────────────────────────────────────────────

export function StepCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm p-4 ${className ?? ''}`}>
      {children}
    </div>
  );
}

// ── Formulario ────────────────────────────────────────────────────────────────

interface FormInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}

export function FormInput({ label, value, onChange, type = 'text', placeholder }: FormInputProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#111827]"
      />
    </div>
  );
}

// ── Mensajes ──────────────────────────────────────────────────────────────────

export function ErrorMessage({ message }: { message: string }) {
  if (!message) return null;
  return <p className="text-sm text-red-600 mb-4">{message}</p>;
}
