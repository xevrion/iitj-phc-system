import React, { useState, useEffect } from "react";
import { XCircle, AlertCircle, Loader2 } from "lucide-react";
import Button from "../../../components/ui/Button";
import { cn } from "../../../utils/cn";
import { formatDoctorName } from "../../../utils/doctorName";
import { getAvailableDoctors, cancelAppointment, bookAppointmentStaff, getAllAppointments } from "../services/reception.service";

const STATUS_COLORS = {
  BOOKED: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const TIME_SLOTS = [
  { label: "09:00 AM", value: "09:00" },
  { label: "10:00 AM", value: "10:00" },
  { label: "11:00 AM", value: "11:00" },
  { label: "12:00 PM", value: "12:00" },
  { label: "02:00 PM", value: "14:00" },
  { label: "03:00 PM", value: "15:00" },
  { label: "04:00 PM", value: "16:00" },
];

const sortUpcomingAppointments = (appointments) =>
  [...appointments].sort((left, right) => {
    const leftTime = new Date(left.appointmentTime).getTime();
    const rightTime = new Date(right.appointmentTime).getTime();

    if (leftTime !== rightTime) {
      return leftTime - rightTime;
    }

    if (left.isEmergency !== right.isEmergency) {
      return left.isEmergency ? -1 : 1;
    }

    return (left.patient?.name || "").localeCompare(right.patient?.name || "");
  });

const sortHistoricalAppointments = (appointments) =>
  [...appointments].sort((left, right) => {
    const leftTime = new Date(left.appointmentTime).getTime();
    const rightTime = new Date(right.appointmentTime).getTime();

    if (leftTime !== rightTime) {
      return rightTime - leftTime;
    }

    return (left.patient?.name || "").localeCompare(right.patient?.name || "");
  });

const ReceptionAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showBookForm, setShowBookForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    patientId: "",
    doctorId: "",
    date: "",
    time: "",
    slotDuration: "30",
    isEmergency: false,
  });

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [apptRes, docRes] = await Promise.all([
        getAllAppointments(),
        getAvailableDoctors(),
      ]);
      if (apptRes.success) setAppointments(apptRes.data);
      if (docRes.success) setDoctors(docRes.data);
    } catch {
      setError("Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const now = Date.now();
  const upcomingAppointments = sortUpcomingAppointments(
    appointments.filter((appointment) => {
      const appointmentTime = new Date(appointment.appointmentTime).getTime();
      return appointment.status !== "CANCELLED" && appointmentTime >= now;
    })
  );
  const pastAppointments = sortHistoricalAppointments(
    appointments.filter((appointment) => {
      const appointmentTime = new Date(appointment.appointmentTime).getTime();
      return appointment.status !== "CANCELLED" && appointmentTime < now;
    })
  );
  const cancelledAppointments = sortHistoricalAppointments(
    appointments.filter((appointment) => appointment.status === "CANCELLED")
  );
  const minDate = new Date().toLocaleDateString("en-CA");

  const handleCancel = async (id) => {
    if (!confirm("Cancel this appointment?")) return;
    try {
      await cancelAppointment(id);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: "CANCELLED" } : a));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel appointment.");
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const appointmentTime = new Date(`${form.date}T${form.time}:00`).toISOString();
      if (new Date(appointmentTime).getTime() <= Date.now()) {
        setError("Appointment time must be in the future.");
        setSaving(false);
        return;
      }
      const res = await bookAppointmentStaff({
        patientId: form.patientId,
        doctorId: form.doctorId,
        appointmentTime,
        slotDuration: Number(form.slotDuration),
        isEmergency: form.isEmergency,
      });
      if (res.success) {
        setShowBookForm(false);
        setForm({ patientId: "", doctorId: "", date: "", time: "", slotDuration: "30", isEmergency: false });
        await fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to book appointment.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-gray-500 font-medium">Loading appointments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        </div>
        <Button onClick={() => setShowBookForm(!showBookForm)}>
          {showBookForm ? "Cancel" : "Book Appointment"}
        </Button>
      </div>

      {error && (
        <div className="flex gap-3 items-center p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
          <AlertCircle size={18} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {showBookForm && (
        <form onSubmit={handleBook} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-bold text-gray-900">New Appointment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Patient ID</label>
              <input
                className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                placeholder="Patient UUID"
                value={form.patientId}
                onChange={e => setForm({ ...form, patientId: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Doctor</label>
              <select
                className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                value={form.doctorId}
                onChange={e => setForm({ ...form, doctorId: e.target.value })}
                required
              >
                <option value="">Select doctor...</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{formatDoctorName(d.name)} ({d.doctorType})</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date</label>
              <input
                type="date"
                className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                min={minDate}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Time</label>
              <select
                className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                value={form.time}
                onChange={e => setForm({ ...form, time: e.target.value })}
                required
              >
                <option value="">Select time...</option>
                {TIME_SLOTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Duration</label>
              <select
                className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                value={form.slotDuration}
                onChange={e => setForm({ ...form, slotDuration: e.target.value })}
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>
            <div className="flex items-center gap-3 pt-5">
              <input
                type="checkbox"
                id="emergency"
                checked={form.isEmergency}
                onChange={e => setForm({ ...form, isEmergency: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="emergency" className="text-sm font-medium text-gray-700">Emergency appointment</label>
            </div>
          </div>
          <Button type="submit" isLoading={saving}>Confirm Booking</Button>
        </form>
      )}

      <div className="space-y-6">
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Upcoming Appointments <span className="text-gray-400 font-normal text-sm">({upcomingAppointments.length})</span></h2>
          </div>
          <AppointmentTable appointments={upcomingAppointments} onCancel={handleCancel} formatDoctorName={formatDoctorName} />
        </section>

        <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Past Appointments <span className="text-gray-400 font-normal text-sm">({pastAppointments.length})</span></h2>
          </div>
          <AppointmentTable appointments={pastAppointments} onCancel={handleCancel} formatDoctorName={formatDoctorName} emptyMessage="No past appointments." />
        </section>

        <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Cancelled Appointments <span className="text-gray-400 font-normal text-sm">({cancelledAppointments.length})</span></h2>
          </div>
          <AppointmentTable appointments={cancelledAppointments} onCancel={handleCancel} formatDoctorName={formatDoctorName} emptyMessage="No cancelled appointments." />
        </section>
      </div>
    </div>
  );
};

const AppointmentTable = ({
  appointments,
  onCancel,
  formatDoctorName,
  emptyMessage = "No appointments found.",
}) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left">
      <thead className="bg-gray-50 border-b border-gray-100">
        <tr>
          <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Patient</th>
          <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Doctor</th>
          <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Time</th>
          <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Duration</th>
          <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
          <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {appointments.map((appointment) => (
          <tr key={appointment.id} className="hover:bg-gray-50">
            <td className="px-5 py-3 text-sm font-medium text-gray-900">{appointment.patient?.name || "—"}</td>
            <td className="px-5 py-3 text-sm text-gray-600">{formatDoctorName(appointment.doctor?.name)}</td>
            <td className="px-5 py-3 text-sm text-gray-600">
              {new Date(appointment.appointmentTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
              {appointment.isEmergency && <span className="ml-2 text-xs bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded">EMERGENCY</span>}
            </td>
            <td className="px-5 py-3 text-sm text-gray-600">{appointment.slotDuration} min</td>
            <td className="px-5 py-3">
              <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold", STATUS_COLORS[appointment.status] || "bg-gray-100 text-gray-600")}>
                {appointment.status}
              </span>
            </td>
            <td className="px-5 py-3 text-right">
              {appointment.status === "BOOKED" && (
                <button
                  onClick={() => onCancel(appointment.id)}
                  className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1 ml-auto"
                >
                  <XCircle size={14} /> Cancel
                </button>
              )}
            </td>
          </tr>
        ))}
        {appointments.length === 0 && (
          <tr>
            <td colSpan="6" className="px-5 py-10 text-center text-gray-400 text-sm">{emptyMessage}</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export default ReceptionAppointments;
