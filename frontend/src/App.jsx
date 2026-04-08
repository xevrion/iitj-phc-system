import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import useAuthStore from "./store/useAuthStore";
import LoginPage from "./features/auth/pages/LoginPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PatientDashboard from "./features/patient/pages/PatientDashboard";
import "./App.css";

function RootRedirect() {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  const rolePath = user?.role?.toLowerCase().replace("_", "-");
  return <Navigate to={`/${rolePath}`} replace />;
}

function App() {
  return (
    <BrowserRouter>
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
