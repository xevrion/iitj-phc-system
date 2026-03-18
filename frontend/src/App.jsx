import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AppLayout from "./layouts/AppLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PatientsPage from "./pages/modules/PatientsPage";
import DoctorsPage from "./pages/modules/DoctorsPage";
import AppointmentsPage from "./pages/modules/AppointmentsPage";
import VisitsPage from "./pages/modules/VisitsPage";
import PrescriptionsPage from "./pages/modules/PrescriptionsPage";
import LabPage from "./pages/modules/LabPage";
import MedicinesPage from "./pages/modules/MedicinesPage";
import BillingPage from "./pages/modules/BillingPage";
import CheckinPage from "./pages/modules/CheckinPage";
import DocumentsPage from "./pages/modules/DocumentsPage";

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="patients" element={<PatientsPage />} />
        <Route path="doctors" element={<DoctorsPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="visits" element={<VisitsPage />} />
        <Route path="prescriptions" element={<PrescriptionsPage />} />
        <Route path="lab" element={<LabPage />} />
        <Route path="medicines" element={<MedicinesPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="checkin" element={<CheckinPage />} />
        <Route path="documents" element={<DocumentsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}
