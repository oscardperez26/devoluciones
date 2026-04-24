import { useNavigate } from 'react-router-dom';
import { useWizardStore } from '@/store/wizard.store';

export default function Confirmation() {
  const navigate = useNavigate();
  const { ticketNumber, totalRefund, confirmationEmail, returnId, resetReturn } = useWizardStore();

  function handleViewStatus() {
    navigate('/estado');
  }

  function handleNewReturn() {
    resetReturn();
    navigate('/paso-2');
  }

  if (!ticketNumber) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No hay una solicitud activa.</p>
          <button onClick={() => navigate('/')} className="text-[#4F46E5] underline">Volver al inicio</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(rgba(0,0,0,0.5),rgba(0,0,0,0.5)), url(https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1600) center/cover no-repeat',
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✓</span>
        </div>

        <h1 className="text-2xl font-bold text-[#111827] mb-2">¡Solicitud enviada!</h1>
        <p className="text-gray-500 text-sm mb-6">Hemos recibido tu solicitud de devolución.</p>

        <div className="bg-[#F9FAFB] rounded-xl p-4 mb-6 space-y-2 text-left">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Número de ticket</span>
            <span className="font-bold text-[#111827]">{ticketNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total a reembolsar</span>
            <span className="font-semibold">${totalRefund.toLocaleString('es-CO')}</span>
          </div>
          {confirmationEmail && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Confirmación a</span>
              <span className="text-gray-700">{confirmationEmail}</span>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 mb-6">
          Nuestro equipo revisará tu solicitud en los próximos 3 días hábiles y recibirás una notificación por correo.
        </p>

        <div className="space-y-3">
          {returnId && (
            <button
              onClick={handleViewStatus}
              className="w-full bg-[#111827] hover:bg-gray-800 text-white font-semibold rounded-xl py-3 transition-colors"
            >
              Ver estado de mi devolución →
            </button>
          )}
          <button
            onClick={handleNewReturn}
            className="w-full border border-gray-300 hover:border-gray-400 text-gray-600 font-semibold rounded-xl py-3 transition-colors"
          >
            Iniciar otra devolución
          </button>
        </div>
      </div>
    </div>
  );
}
