import React from "react";
import { Routes, Route, Navigate } from "react-router";
import { LayoutDashboard, Package } from "lucide-react";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import PharmacyOverview from "./PharmacyOverview";
import MedicineInventory from "./MedicineInventory";

const pharmacyNavItems = [
  { label: "Pharmacy Desk", path: "/pharmacy-staff", icon: LayoutDashboard },
  { label: "Medicine Inventory", path: "/pharmacy-staff/inventory", icon: Package },
];

const PharmacyDashboard = () => {
  return (
    <DashboardLayout role="PHARMACY_STAFF" navItems={pharmacyNavItems}>
      <Routes>
        <Route index element={<PharmacyOverview />} />
        <Route path="inventory" element={<MedicineInventory />} />
        <Route path="*" element={<Navigate to="/pharmacy-staff" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default PharmacyDashboard;
