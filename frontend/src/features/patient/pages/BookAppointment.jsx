import React, { useState, useEffect } from "react";
import { Calendar, User, AlertCircle, CheckCircle2, RotateCw } from "lucide-react";
import { cn } from "../../../utils/cn";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { getDoctors, bookAppointment } from "../services/patient.service";

const TIME_SLOTS = [
  { label: "09:00 AM", value: "09:00" },
  { label: "10:00 AM", value: "10:00" },
  { label: "11:00 AM", value: "11:00" },
  { label: "12:00 PM", value: "12:00" },
  { label: "02:00 PM", value: "14:00" },
  { label: "03:00 PM", value: "15:00" },
  { label: "04:00 PM", value: "16:00" },
];

const BookAppointment = () => {
  const [formData, setFormData] = useState({
    doctorId: "",
    date: "",
    time: "",
    slotDuration: "30",
  });
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const minDate = new Date().toLocaleDateString("en-CA");

  const fetchDoctors = async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    try {
      const response = await getDoctors();
      if (response.success) {
        setDoctors(response.data);
      }
    } catch (err) {
      console.error("Failed to load doctors", err);
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
    // Auto-poll the available list every 10s so new doctors appear without manual refresh
    const interval = setInterval(() => fetchDoctors(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const appointmentTime = new Date(`${formData.date}T${formData.time}:00`).toISOString();
      if (new Date(appointmentTime).getTime() <= Date.now()) {
        setError("Appointment time must be in the future.");
        setIsLoading(false);
        return;
      }
      const response = await bookAppointment({
        doctorId: formData.doctorId,
        appointmentTime,
        slotDuration: Number(formData.slotDuration),
      });
      if (response.success) {
        setIsSuccess(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to book appointment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-6 max-w-md mx-auto">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
          <CheckCircle2 size={40} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Appointment Requested!</h2>
          <p className="text-gray-500 mt-2">
            Your appointment request has been submitted successfully. You will receive a notification once it is confirmed.
          </p>
        </div>
        <Button onClick={() => setIsSuccess(false)} className="w-full">
          Book Another Appointment
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Book an Appointment</h1>
        <p className="text-gray-500">Select a specialist and choose a preferred time slot.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm space-y-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700">Select Specialist Doctor</label>
              <button 
                type="button" 
                onClick={fetchDoctors}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-bold"
              >
                <RotateCw size={12} className={cn(isLoading && "animate-spin")} />
                Refresh List
              </button>
            </div>
            <div className="relative">
              <select 
                className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none appearance-none pl-10"
                value={formData.doctorId}
                onChange={(e) => setFormData({...formData, doctorId: e.target.value})}
                required
              >
                <option value="">Choose a doctor...</option>
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} ({doc.doctorType})
                  </option>
                ))}
              </select>
              <User className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100 flex gap-2 items-center">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="date"
              label="Preferred Date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              min={minDate}
              required
            />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Time Slot</label>
              <select
                className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none appearance-none"
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
                required
              >
                <option value="">Select a time...</option>
                {TIME_SLOTS.map(slot => (
                  <option key={slot.value} value={slot.value}>{slot.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Slot Duration</label>
            <select
              className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none appearance-none"
              value={formData.slotDuration}
              onChange={(e) => setFormData({...formData, slotDuration: e.target.value})}
              required
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
            </select>
          </div>

          <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-lg border border-amber-100 text-amber-800">
            <AlertCircle size={20} className="shrink-0" />
            <p className="text-xs font-medium">
              Note: Appointments are subject to doctor availability. In case of severe emergency, please visit the PHC directly.
            </p>
          </div>
        </div>

        <Button type="submit" className="w-full h-12 text-lg font-bold" isLoading={isLoading}>
          Confirm Booking Request
        </Button>
      </form>
    </div>
  );
};

export default BookAppointment;
