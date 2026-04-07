import React from "react";
import { Routes, Route, Navigate } from "react-router";
import { 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  FlaskConical, 
  User, 
  Clock
} from "lucide-react";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import PatientOverview from "./PatientOverview";
import VisitHistory from "./VisitHistory";

const patientNavItems = [
  { label: "Overview", path: "/patient", icon: LayoutDashboard },
  { label: "Book Appointment", path: "/patient/appointments/book", icon: Calendar },
  { label: "Visit History", path: "/patient/visits", icon: Clock },
  { label: "Prescriptions", path: "/patient/prescriptions", icon: FileText },
  { label: "Lab Reports", path: "/patient/lab-reports", icon: FlaskConical },
  { label: "Profile", path: "/patient/profile", icon: User },
];

const PatientDashboard = () => {
  return (
    <DashboardLayout role="PATIENT" navItems={patientNavItems}>
      <Routes>
        <Route index element={<PatientOverview />} />
        <Route path="visits" element={<VisitHistory />} />
        <Route path="prescriptions" element={<div>Prescriptions Placeholder</div>} />
        <Route path="lab-reports" element={<div>Lab Reports Placeholder</div>} />
        <Route path="appointments/book" element={<div>Book Appointment Placeholder</div>} />
        <Route path="profile" element={<div>Profile Placeholder</div>} />
        <Route path="*" element={<Navigate to="/patient" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default PatientDashboard;
