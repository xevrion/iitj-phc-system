import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import PatientLayout from "./layouts/patient/PatientLayout";
import PatientHomePage from "./pages/patient/PatientHomePage";
import PatientAppointmentsPage from "./pages/patient/PatientAppointmentsPage";
import PatientRecordsPage from "./pages/patient/PatientRecordsPage";
import PatientDocumentsPage from "./pages/patient/PatientDocumentsPage";
import PatientProfilePage from "./pages/patient/PatientProfilePage";
import { getDefaultRouteForRole } from "./utils/roles";

function ProtectedRoute({ children }) {
  const { token, isHydrating } = useAuth();
  if (isHydrating) return <div className="p-10 text-center text-slate-600">Loading session...</div>;
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function RoleRoute({ role, children }) {
  const { user } = useAuth();
  if (!user) return <div className="p-10 text-center text-slate-600">Loading profile...</div>;
  if (user.role !== role) return <Navigate to="/unauthorized" replace />;
  return children;
}

function RootRedirect() {
  const { user, token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (!user) return <div className="p-10 text-center text-slate-600">Loading profile...</div>;
  return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route
        path="/patient"
        element={
          <ProtectedRoute>
            <RoleRoute role="PATIENT">
              <PatientLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<PatientHomePage />} />
        <Route path="appointments" element={<PatientAppointmentsPage />} />
        <Route path="records" element={<PatientRecordsPage />} />
        <Route path="documents" element={<PatientDocumentsPage />} />
        <Route path="profile" element={<PatientProfilePage />} />
      </Route>

      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
