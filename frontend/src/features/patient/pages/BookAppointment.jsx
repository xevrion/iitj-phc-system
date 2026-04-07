import React, { useState } from "react";
import { Calendar, User, Clipboard, AlertCircle, CheckCircle2 } from "lucide-react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

const BookAppointment = () => {
  const [formData, setFormData] = useState({
    doctorId: "",
    date: "",
    reason: "",
    isEmergency: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Static doctors for now
  const doctors = [
    { id: "d1", name: "Dr. Ananya Sharma (Physician)", available: true },
    { id: "d2", name: "Dr. Rajesh Kumar (Orthopedic)", available: true },
    { id: "d3", name: "Dr. S. K. Singh (Cardiologist)", available: false },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
    }, 1500);
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
            <label className="text-sm font-medium text-gray-700">Select Specialist Doctor</label>
            <div className="relative">
              <select 
                className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none appearance-none pl-10"
                value={formData.doctorId}
                onChange={(e) => setFormData({...formData, doctorId: e.target.value})}
                required
              >
                <option value="">Choose a doctor...</option>
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.id} disabled={!doc.available}>
                    {doc.name} {!doc.available ? "(Unavailable)" : ""}
                  </option>
                ))}
              </select>
              <User className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              type="date" 
              label="Preferred Date" 
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              required
            />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Time Slot (Optional)</label>
              <select className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none appearance-none">
                <option>Select a slot...</option>
                <option>09:00 AM - 10:00 AM</option>
                <option>10:00 AM - 11:00 AM</option>
                <option>11:00 AM - 12:00 PM</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Reason for Appointment</label>
            <div className="relative">
              <textarea 
                className="w-full min-h-[100px] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none pl-10 pt-2"
                placeholder="Briefly describe your symptoms or concern..."
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                required
              />
              <Clipboard className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            </div>
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
