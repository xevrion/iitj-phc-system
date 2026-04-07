import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import LoginPage from "./features/auth/pages/LoginPage";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<div className="flex h-screen items-center justify-center text-red-500 text-xl font-bold">404: Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
