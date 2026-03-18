import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { SideLink, Button } from "../components/Ui";

const links = [
  ["/app", "Dashboard"],
  ["/app/patients", "Patients"],
  ["/app/doctors", "Doctors"],
  ["/app/appointments", "Appointments"],
  ["/app/visits", "Visits"],
  ["/app/prescriptions", "Prescriptions"],
  ["/app/lab", "Lab"],
  ["/app/medicines", "Medicines"],
  ["/app/billing", "Billing"],
  ["/app/checkin", "Check-in"],
  ["/app/documents", "Documents"],
];

export default function AppLayout() {
  const { user, logout, isHydrating } = useAuth();

  if (isHydrating) {
    return <div className="p-10 text-center text-slate-600">Loading session...</div>;
  }

  return (
    <div className="mx-auto min-h-screen max-w-7xl p-4 md:p-6">
      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <aside className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <h2 className="mb-3 text-lg font-bold text-slate-800">PHC Console</h2>
          <nav className="space-y-1">
            {links.map(([to, label]) => (
              <SideLink key={to} to={to}>
                {label}
              </SideLink>
            ))}
          </nav>
          <div className="mt-6 rounded-md bg-slate-50 p-3 text-xs text-slate-600">
            <div>Role: {user?.role || "-"}</div>
            <div>LDAP: {user?.ldapId || "-"}</div>
          </div>
          <Button onClick={logout} variant="secondary" className="mt-3 w-full">
            Logout
          </Button>
        </aside>
        <main className="space-y-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
