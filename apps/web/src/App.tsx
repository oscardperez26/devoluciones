import { BrowserRouter, Route, Routes } from 'react-router-dom';
import RequireAdminAuth from '@/components/RequireAdminAuth';
import RequireSession from '@/components/RequireSession';
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminLogin from '@/pages/admin/AdminLogin';
import ReturnDetail from '@/pages/admin/ReturnDetail';
import ReturnsList from '@/pages/admin/ReturnsList';
import Confirmation from '@/pages/wizard/Confirmation';
import Step1Entry from '@/pages/wizard/Step1Entry';
import Step2Products from '@/pages/wizard/Step2Products';
import Step3Agreement from '@/pages/wizard/Step3Agreement';
import Step4Delivery from '@/pages/wizard/Step4Delivery';
import Step5Refund from '@/pages/wizard/Step5Refund';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Step1Entry />} />
        <Route path="/paso-2" element={<RequireSession><Step2Products /></RequireSession>} />
        <Route path="/paso-3" element={<RequireSession><Step3Agreement /></RequireSession>} />
        <Route path="/paso-4" element={<RequireSession><Step4Delivery /></RequireSession>} />
        <Route path="/paso-5" element={<RequireSession><Step5Refund /></RequireSession>} />
        <Route path="/confirmacion" element={<Confirmation />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<RequireAdminAuth><AdminLayout /></RequireAdminAuth>}>
          <Route index element={<ReturnsList />} />
          <Route path="devoluciones" element={<ReturnsList />} />
          <Route path="devoluciones/:id" element={<ReturnDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
