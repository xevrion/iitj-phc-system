import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import useAuthStore from "./store/useAuthStore";
import LoginPage from "./features/auth/pages/LoginPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PatientDashboard from "./features/patient/pages/PatientDashboard";
import DoctorDashboard from "./features/doctor/pages/DoctorDashboard";
import ReceptionDashboard from "./features/reception/pages/ReceptionDashboard";
import LabDashboard from "./features/lab/pages/LabDashboard";
import PharmacyDashboard from "./features/pharmacy/pages/PharmacyDashboard";
import AdminDashboard from "./features/admin/pages/AdminDashboard";
import ToastContainer from "./components/ui/ToastContainer";
import "./App.css";

function RootRedirect() {
  const { isAuthenticated, user, loading } = useAuthStore();
  
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  const rolePath = user?.role?.toLowerCase().replace("_", "-");
  return <Navigate to={`/${rolePath}`} replace />;
}

function App() {
  const { checkAuth, token, loading } = useAuthStore();

  useEffect(() => {
    if (token) {
      checkAuth();
    }
  }, []);

  if (loading && !token) {
    return <div className="flex h-screen items-center justify-center">Loading Application...</div>;
  }

  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* Patient Routes */}
        <Route 
          path="/patient/*" 
          element={
            <ProtectedRoute allowedRoles={["PATIENT"]}>
              <PatientDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Doctor Routes */}
        <Route
          path="/doctor/*"
          element={
            <ProtectedRoute allowedRoles={["DOCTOR"]}>
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />

        {/* Reception Routes */}
        <Route
          path="/reception-staff/*"
          element={
            <ProtectedRoute allowedRoles={["RECEPTION_STAFF"]}>
              <ReceptionDashboard />
            </ProtectedRoute>
          }
        />

        {/* Lab Routes */}
        <Route
          path="/lab-staff/*"
          element={
            <ProtectedRoute allowedRoles={["LAB_STAFF"]}>
              <LabDashboard />
            </ProtectedRoute>
          }
        />

        {/* Pharmacy Routes */}
        <Route
          path="/pharmacy-staff/*"
          element={
            <ProtectedRoute allowedRoles={["PHARMACY_STAFF"]}>
              <PharmacyDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Root Redirection */}
        <Route path="/" element={<RootRedirect />} />

        {/* Error Pages */}
        <Route path="/unauthorized" element={<div className="flex h-screen items-center justify-center text-red-500 text-xl font-bold">403: Unauthorized Access</div>} />
        <Route path="*" element={<div className="flex h-screen items-center justify-center text-red-500 text-xl font-bold">404: Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
