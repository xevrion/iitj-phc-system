import React from "react";
import { Routes, Route, Navigate } from "react-router";
import { LayoutDashboard, UserPlus, Users, Calendar } from "lucide-react";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import ReceptionOverview from "./ReceptionOverview";
import PatientCheckin from "./PatientCheckin";
import PatientsList from "./PatientsList";
import ReceptionAppointments from "./ReceptionAppointments";

const receptionNavItems = [
  { label: "Overview", path: "/reception-staff", icon: LayoutDashboard },
  { label: "Patient Check-in", path: "/reception-staff/checkin", icon: UserPlus },
  { label: "Patient Lookup", path: "/reception-staff/patients", icon: Users },
  { label: "Appointments", path: "/reception-staff/appointments", icon: Calendar },
];

const ReceptionDashboard = () => {
  return (
    <DashboardLayout role="RECEPTION_STAFF" navItems={receptionNavItems}>
      <Routes>
        <Route index element={<ReceptionOverview />} />
        <Route path="checkin" element={<PatientCheckin />} />
        <Route path="patients" element={<PatientsList />} />
        <Route path="appointments" element={<ReceptionAppointments />} />
        <Route path="*" element={<Navigate to="/reception-staff" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default ReceptionDashboard;
