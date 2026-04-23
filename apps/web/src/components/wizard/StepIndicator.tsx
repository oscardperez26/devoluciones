const STEPS = ['Acceso', 'Productos', 'Resumen', 'Entrega', 'Reembolso'];

export default function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const active = step === current;
        const done = step < current;
        return (
          <div key={step} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-[#111827] text-white'
                    : done
                      ? 'bg-[#16A34A] text-white'
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {done ? '✓' : step}
              </div>
              <span className={`text-xs hidden sm:block ${active ? 'text-[#111827] font-medium' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-8 h-0.5 mb-4 ${done ? 'bg-[#16A34A]' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
