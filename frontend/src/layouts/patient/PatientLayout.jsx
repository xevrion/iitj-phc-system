import { Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button, SideLink } from "../../components/Ui";

const links = [
  ["/patient", "Home"],
  ["/patient/appointments", "Appointments"],
  ["/patient/records", "Medical Records"],
  ["/patient/documents", "Documents"],
  ["/patient/profile", "Profile"],
];

export default function PatientLayout() {
  const { user, logout, isHydrating } = useAuth();

  if (isHydrating) {
    return <div className="p-10 text-center text-slate-600">Loading session...</div>;
  }

  return (
    <div className="mx-auto min-h-screen max-w-7xl p-4 md:p-6">
      <div className="grid gap-4 md:grid-cols-[250px_1fr]">
        <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800">Patient Portal</h2>
          <p className="mt-1 text-sm text-slate-500">Manage appointments and records.</p>

          <nav className="mt-5 space-y-1">
            {links.map(([to, label]) => (
              <SideLink key={to} to={to}>
                {label}
              </SideLink>
            ))}
          </nav>

          <div className="mt-6 rounded-md bg-slate-50 p-3 text-xs text-slate-600">
            <div className="font-semibold text-slate-700">Logged in</div>
            <div>LDAP: {user?.ldapId || "-"}</div>
            <div>Role: {user?.role || "-"}</div>
            <div>Name: {user?.patient?.name || "-"}</div>
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
