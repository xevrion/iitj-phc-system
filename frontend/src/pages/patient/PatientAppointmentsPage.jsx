import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/endpoints";
import { Button, Card, Field, Grid, Input, Notice, Page, Select } from "../../components/Ui";
import { DataTable, EmptyState } from "../../components/patient/PatientWidgets";

function toIsoFromLocal(date, time) {
  const dt = new Date(`${date}T${time}`);
  return dt.toISOString();
}

function formatDateTime(value) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function PatientAppointmentsPage() {
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    doctorId: "",
    date: "",
    time: "",
    slotDuration: "15",
    isEmergency: "false",
  });

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [doctorRes, appointmentRes] = await Promise.all([
        api.doctors.list(),
        api.appointments.my(),
      ]);
      setDoctors(doctorRes.data || []);
      setAppointments(appointmentRes.data || []);
    } catch (err) {
      setError(err.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const upcoming = useMemo(
    () => appointments.filter((a) => a.status === "BOOKED").length,
    [appointments]
  );

  const onBook = async () => {
    setMessage("");
    setError("");
    try {
      await api.appointments.book({
        doctorId: form.doctorId,
        appointmentTime: toIsoFromLocal(form.date, form.time),
        slotDuration: Number(form.slotDuration),
        isEmergency: form.isEmergency === "true",
      });
      setMessage("Appointment booked successfully.");
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to book appointment");
    }
  };

  const onCancel = async (id) => {
    setMessage("");
    setError("");
    try {
      await api.appointments.cancel(id);
      setMessage("Appointment cancelled.");
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to cancel appointment");
    }
  };

  return (
    <Page title="Appointments" subtitle="Book and manage your consultations.">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Available Doctors</div>
          <div className="mt-1 text-2xl font-bold text-slate-800">{doctors.length}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Upcoming</div>
          <div className="mt-1 text-2xl font-bold text-slate-800">{upcoming}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total History</div>
          <div className="mt-1 text-2xl font-bold text-slate-800">{appointments.length}</div>
        </div>
      </div>

      <Card title="Book New Appointment">
        <Grid>
          <Field label="Doctor">
            <Select value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })}>
              <option value="">Select doctor</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name || "Unnamed"} ({d.specialization || d.doctorType})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date"><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="Time"><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></Field>
          <Field label="Duration (minutes)"><Input type="number" min="5" step="5" value={form.slotDuration} onChange={(e) => setForm({ ...form, slotDuration: e.target.value })} /></Field>
          <Field label="Emergency">
            <Select value={form.isEmergency} onChange={(e) => setForm({ ...form, isEmergency: e.target.value })}>
              <option value="false">No</option>
              <option value="true">Yes</option>
            </Select>
          </Field>
        </Grid>
        {error ? <Notice kind="error">{error}</Notice> : null}
        {message ? <Notice kind="success">{message}</Notice> : null}
        <div className="flex gap-2">
          <Button
            onClick={onBook}
            disabled={
              !form.doctorId || !form.date || !form.time || loading
            }
          >
            Book Appointment
          </Button>
          <Button variant="secondary" onClick={loadData}>Refresh</Button>
        </div>
      </Card>

      <Card title="My Appointments">
        {loading ? (
          <p className="text-sm text-slate-500">Loading appointments...</p>
        ) : appointments.length === 0 ? (
          <EmptyState
            title="No appointments yet"
            description="Book your first appointment using the form above."
          />
        ) : (
          <DataTable
            columns={[
              { key: "appointmentTime", label: "Time", render: (row) => formatDateTime(row.appointmentTime) },
              { key: "doctor", label: "Doctor", render: (row) => row.doctor?.name || "-" },
              { key: "specialization", label: "Specialization", render: (row) => row.doctor?.specialization || "-" },
              { key: "slotDuration", label: "Duration", render: (row) => `${row.slotDuration} min` },
              { key: "status", label: "Status" },
              {
                key: "actions",
                label: "Actions",
                render: (row) =>
                  row.status === "BOOKED" ? (
                    <Button variant="danger" className="px-2 py-1 text-xs" onClick={() => onCancel(row.id)}>
                      Cancel
                    </Button>
                  ) : (
                    <span className="text-xs text-slate-400">-</span>
                  ),
              },
            ]}
            rows={appointments}
          />
        )}
      </Card>
    </Page>
  );
}
