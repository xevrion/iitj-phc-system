import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/endpoints";
import { Card, Page } from "../../components/Ui";
import { EmptyState, StatTile } from "../../components/patient/PatientWidgets";
import { usePatientProfile } from "../../hooks/usePatientProfile";

function formatDateTime(value) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function PatientHomePage() {
  const { profile, loading: profileLoading, error: profileError } = usePatientProfile();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [myAppointments, doctorList] = await Promise.all([
          api.appointments.my(),
          api.doctors.list(),
        ]);
        setAppointments(myAppointments.data || []);
        setDoctors(doctorList.data || []);
      } catch (err) {
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const upcoming = useMemo(
    () =>
      [...appointments]
        .filter((a) => a.status === "BOOKED")
        .sort((a, b) => new Date(a.appointmentTime) - new Date(b.appointmentTime))[0],
    [appointments]
  );

  const bookedCount = appointments.filter((a) => a.status === "BOOKED").length;

  return (
    <Page
      title="Welcome"
      subtitle="Track your appointments, medical records, and shared documents in one place."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatTile label="Your Name" value={profile?.name || "-"} helper="From patient profile" />
        <StatTile label="Booked Appointments" value={bookedCount} helper="Active upcoming visits" />
        <StatTile label="Available Doctors" value={doctors.length} helper="Currently marked available" />
      </div>

      <Card title="Next Appointment">
        {loading || profileLoading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : error || profileError ? (
          <p className="text-sm text-rose-600">{error || profileError}</p>
        ) : upcoming ? (
          <div className="rounded-lg bg-sky-50 p-4">
            <div className="text-sm text-sky-700">{formatDateTime(upcoming.appointmentTime)}</div>
            <div className="mt-1 text-lg font-semibold text-slate-800">
              Dr. {upcoming.doctor?.name || "Unknown"}
            </div>
            <div className="text-sm text-slate-600">
              {upcoming.doctor?.specialization || "General consultation"} | {upcoming.slotDuration} min
            </div>
          </div>
        ) : (
          <EmptyState
            title="No upcoming appointment"
            description="Book one from the Appointments tab to get started."
          />
        )}
      </Card>

      <Card title="Quick Tips">
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>Book appointments with available doctors directly from the portal.</li>
          <li>Use Medical Records to check prescriptions, lab reports, and billing status by visit.</li>
          <li>Upload external reports in the Documents section for continuity of care.</li>
        </ul>
      </Card>
    </Page>
  );
}
