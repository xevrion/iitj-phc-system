import React, { useState, useEffect } from "react";
import { Calendar, User, Clock, XCircle, AlertCircle, Loader2, Stethoscope } from "lucide-react";
import Button from "../../../components/ui/Button";
import { cn } from "../../../utils/cn";
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

const getAppointmentGroup = (appointment, now) => {
  const appointmentTime = new Date(appointment.appointmentTime).getTime();

  if (appointment.status === "BOOKED" && appointmentTime >= now) {
    return 0;
  }

  if (appointment.status !== "CANCELLED" && appointmentTime >= now) {
    return 1;
  }

  if (appointment.status !== "CANCELLED") {
    return 2;
  }

  return 3;
};

const sortAppointmentsForReception = (appointments) => {
  const now = Date.now();

  return [...appointments].sort((left, right) => {
    const leftGroup = getAppointmentGroup(left, now);
    const rightGroup = getAppointmentGroup(right, now);

    if (leftGroup !== rightGroup) {
      return leftGroup - rightGroup;
    }

    const leftTime = new Date(left.appointmentTime).getTime();
    const rightTime = new Date(right.appointmentTime).getTime();

    if (leftGroup <= 1) {
      if (leftTime !== rightTime) {
        return leftTime - rightTime;
      }

      if (left.isEmergency !== right.isEmergency) {
        return left.isEmergency ? -1 : 1;
      }

      return (left.patient?.name || "").localeCompare(right.patient?.name || "");
    }

    if (leftTime !== rightTime) {
      return rightTime - leftTime;
    }

    return (left.patient?.name || "").localeCompare(right.patient?.name || "");
  });
};

const formatDoctorName = (name) => {
  if (!name) {
    return "—";
  }

  return name.startsWith("Dr. ") ? name : `Dr. ${name}`;
};

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

  const orderedAppointments = sortAppointmentsForReception(appointments);

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
          <p className="text-gray-500">Manage and book patient appointments.</p>
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
                  <option key={d.id} value={d.id}>Dr. {d.name} ({d.doctorType})</option>
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

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">All Appointments <span className="text-gray-400 font-normal text-sm">({appointments.length})</span></h2>
        </div>
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
              {orderedAppointments.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">{a.patient?.name || "—"}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{formatDoctorName(a.doctor?.name)}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">
                    {new Date(a.appointmentTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    {a.isEmergency && <span className="ml-2 text-xs bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded">EMERGENCY</span>}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">{a.slotDuration} min</td>
                  <td className="px-5 py-3">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold", STATUS_COLORS[a.status] || "bg-gray-100 text-gray-600")}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {a.status === "BOOKED" && (
                      <button
                        onClick={() => handleCancel(a.id)}
                        className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1 ml-auto"
                      >
                        <XCircle size={14} /> Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {orderedAppointments.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-5 py-10 text-center text-gray-400 text-sm">No appointments found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReceptionAppointments;
