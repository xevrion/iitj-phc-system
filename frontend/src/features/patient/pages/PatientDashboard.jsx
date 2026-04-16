import React from "react";
import { Routes, Route, Navigate } from "react-router";
import { 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  FlaskConical, 
  User, 
  Clock,
  Receipt,
  FolderOpen
} from "lucide-react";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import PatientOverview from "./PatientOverview";
import VisitHistory from "./VisitHistory";
import Prescriptions from "./Prescriptions";
import LabReports from "./LabReports";
import BookAppointment from "./BookAppointment";
import Profile from "./Profile";
import Billing from "./Billing";
import MedicalRecords from "./MedicalRecords";

const patientNavItems = [
  { label: "Overview", path: "/patient", icon: LayoutDashboard },
  { label: "Book Appointment", path: "/patient/appointments/book", icon: Calendar },
  { label: "Visit History", path: "/patient/visits", icon: Clock },
  { label: "Prescriptions", path: "/patient/prescriptions", icon: FileText },
  { label: "Lab Reports", path: "/patient/lab-reports", icon: FlaskConical },
  { label: "Medical Vault", path: "/patient/vault", icon: FolderOpen },
  { label: "Billing", path: "/patient/billing", icon: Receipt },
  { label: "Profile", path: "/patient/profile", icon: User },
];

const PatientDashboard = () => {
  return (
    <DashboardLayout role="PATIENT" navItems={patientNavItems}>
      <Routes>
        <Route index element={<PatientOverview />} />
        <Route path="visits" element={<VisitHistory />} />
        <Route path="prescriptions" element={<Prescriptions />} />
        <Route path="lab-reports" element={<LabReports />} />
        <Route path="appointments/book" element={<BookAppointment />} />
        <Route path="vault" element={<MedicalRecords />} />
        <Route path="billing" element={<Billing />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/patient" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default PatientDashboard;
