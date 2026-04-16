import React from "react";
import { Routes, Route, Navigate } from "react-router";
import { LayoutDashboard, Users, CalendarDays } from "lucide-react";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import AdminOverview from "./AdminOverview";
import UserManagement from "./UserManagement";
import EventsManagement from "./EventsManagement";

const adminNavItems = [
  { label: "Overview", path: "/admin", icon: LayoutDashboard },
  { label: "Users", path: "/admin/users", icon: Users },
  { label: "Events", path: "/admin/events", icon: CalendarDays },
];

const AdminDashboard = () => {
  return (
    <DashboardLayout role="ADMIN" navItems={adminNavItems}>
      <Routes>
        <Route index element={<AdminOverview />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="events" element={<EventsManagement />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default AdminDashboard;
