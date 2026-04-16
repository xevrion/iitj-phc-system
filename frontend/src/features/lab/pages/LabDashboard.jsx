import React from "react";
import { Routes, Route, Navigate } from "react-router";
import { LayoutDashboard } from "lucide-react";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import LabOverview from "./LabOverview";

const labNavItems = [
  { label: "Lab Desk", path: "/lab-staff", icon: LayoutDashboard },
];

const LabDashboard = () => {
  return (
    <DashboardLayout role="LAB_STAFF" navItems={labNavItems}>
      <Routes>
        <Route index element={<LabOverview />} />
        <Route path="*" element={<Navigate to="/lab-staff" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default LabDashboard;
