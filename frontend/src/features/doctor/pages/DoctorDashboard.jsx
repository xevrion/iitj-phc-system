import React from "react";
import { Routes, Route, Navigate } from "react-router";
import { LayoutDashboard, Clock3, CalendarDays, User } from "lucide-react";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import DoctorOverview from "./DoctorOverview";
import DoctorQueue from "./DoctorQueue";
import DoctorAppointments from "./DoctorAppointments";

const doctorNavItems = [
  { label: "Overview", path: "/doctor", icon: LayoutDashboard },
  { label: "Waiting Queue", path: "/doctor/queue", icon: Clock3 },
  { label: "Appointments", path: "/doctor/appointments", icon: CalendarDays },
  { label: "Profile", path: "/doctor/profile", icon: User },
];

const DoctorDashboard = () => {
  return (
    <DashboardLayout role="DOCTOR" navItems={doctorNavItems}>
      <Routes>
        <Route index element={<DoctorOverview />} />
        <Route path="queue" element={<DoctorQueue />} />
        <Route path="appointments" element={<DoctorAppointments />} />
        <Route
          path="profile"
          element={
            <div className="p-8 bg-white rounded-xl border border-gray-100 shadow-sm">
              Doctor Profile Placeholder
            </div>
          }
        />
        <Route path="*" element={<Navigate to="/doctor" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default DoctorDashboard;
