import React from "react";
import { 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  FlaskConical, 
  User, 
  Clock
} from "lucide-react";
import DashboardLayout from "../../../components/layout/DashboardLayout";

const patientNavItems = [
  { label: "Overview", path: "/patient", icon: LayoutDashboard },
  { label: "Book Appointment", path: "/patient/appointments/book", icon: Calendar },
  { label: "Visit History", path: "/patient/visits", icon: Clock },
  { label: "Prescriptions", path: "/patient/prescriptions", icon: FileText },
  { label: "Lab Reports", path: "/patient/lab-reports", icon: FlaskConical },
  { label: "Profile", path: "/patient/profile", icon: User },
];

const PatientDashboard = ({ children }) => {
  return (
    <DashboardLayout role="PATIENT" navItems={patientNavItems}>
      {children || <div className="text-2xl font-bold">Welcome to your Dashboard</div>}
    </DashboardLayout>
  );
};

export default PatientDashboard;
