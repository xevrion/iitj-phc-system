import React from "react";
import { Routes, Route, Navigate } from "react-router";
import { 
  LayoutDashboard, 
  UserPlus, 
  Users, 
  Calendar, 
  Clock, 
  ClipboardCheck 
} from "lucide-react";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import ReceptionOverview from "./ReceptionOverview";
import PatientCheckin from "./PatientCheckin";

const receptionNavItems = [
  { label: "Overview", path: "/reception-staff", icon: LayoutDashboard },
  { label: "Patient Check-in", path: "/reception-staff/checkin", icon: UserPlus },
  { label: "All Patients", path: "/reception-staff/patients", icon: Users },
  { label: "Appointments", path: "/reception-staff/appointments", icon: Calendar },
];

const ReceptionDashboard = () => {
  return (
    <DashboardLayout role="RECEPTION_STAFF" navItems={receptionNavItems}>
      <Routes>
        <Route index element={<ReceptionOverview />} />
        <Route path="checkin" element={<PatientCheckin />} />
        <Route path="patients" element={<div className="p-8 bg-white rounded-xl border border-gray-100 shadow-sm">Patients List Placeholder</div>} />
        <Route path="appointments" element={<div className="p-8 bg-white rounded-xl border border-gray-100 shadow-sm">Appointments Management Placeholder</div>} />
        <Route path="*" element={<Navigate to="/reception-staff" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default ReceptionDashboard;
