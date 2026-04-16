import React, { useState, useEffect } from "react";
import { 
  QrCode, 
  Search, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Activity,
  Thermometer,
  Weight,
  Stethoscope,
  ChevronRight
} from "lucide-react";
import { cn } from "../../../utils/cn";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { identifyPatientByQR, getAvailableDoctors, createVisit } from "../services/reception.service";

const PatientCheckin = () => {
  const [step, setStep] = useState(1); // 1: Identify, 2: Visit Details & Vitals
  const [qrInput, setQrInput] = useState("");
  const [patient, setPatient] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    doctorId: "",
    visitType: "OPD",
    weight: "",
    temperature: "",
    bloodPressure: ""
  });

  useEffect(() => {
    if (step === 2) {
      const fetchDoctors = async () => {
        try {
          const res = await getAvailableDoctors();
          if (res.success) setDoctors(res.data);
        } catch (err) {
          console.error("Failed to load doctors");
        }
      };
      fetchDoctors();
    }
  }, [step]);

  const handleIdentify = async (e) => {
    e.preventDefault();
    if (!qrInput.trim()) return;

    setLoading(true);
    setError("");
    try {
      const res = await identifyPatientByQR(qrInput.trim());
      if (res.success) {
        setPatient(res.data);
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.message || "No patient found with this QR code.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        patientId: patient.id,
        doctorId: formData.doctorId || null,
        visitType: formData.visitType,
        vitals: {
          weight: formData.weight ? parseFloat(formData.weight) : null,
          temperature: formData.temperature ? parseFloat(formData.temperature) : null,
          bloodPressure: formData.bloodPressure || null
        }
      };

      const res = await createVisit(payload);
      if (res.success) {
        setSuccess(`Visit created successfully! Visit ID: ${res.data.id.slice(-8).toUpperCase()}`);
        setStep(3); // Completion screen
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create visit.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setQrInput("");
    setPatient(null);
    setSuccess("");
    setError("");
    setFormData({ doctorId: "", visitType: "OPD", weight: "", temperature: "", bloodPressure: "" });
  };

  if (step === 3) {
    return (
      <div className="max-w-md mx-auto text-center py-12 space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 size={40} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Check-in Complete</h2>
          <p className="text-gray-500 mt-2">{success}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-left space-y-3">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Next Steps</p>
          <div className="flex gap-3 items-start">
            <div className="w-6 h-6 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</div>
            <p className="text-sm text-gray-700">Guide patient to the waiting area.</p>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-6 h-6 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</div>
            <p className="text-sm text-gray-700">The visit is now visible in the assigned doctor's queue.</p>
          </div>
        </div>
        <Button onClick={resetForm} className="w-full">Start New Check-in</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Check-in</h1>
          <p className="text-gray-500">Register a new visit and record vitals.</p>
        </div>
        <div className="flex gap-2">
          {[1, 2].map(s => (
            <div key={s} className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2",
              step >= s ? "bg-blue-600 border-blue-600 text-white" : "border-gray-200 text-gray-400"
            )}>{s}</div>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex gap-3 items-center">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <QrCode size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Scan Digital ID</h3>
              <p className="text-sm text-gray-500 mt-1">Enter the QR code string from the patient's mobile app.</p>
            </div>
            <form onSubmit={handleIdentify} className="space-y-4">
              <Input 
                placeholder="Enter QR Code ID (e.g. QR001)" 
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                autoFocus
              />
              <Button type="submit" className="w-full gap-2" isLoading={loading}>
                Identify Patient <ArrowRight size={18} />
              </Button>
            </form>
          </div>

          <div className="bg-gray-50 p-8 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 bg-white text-gray-400 rounded-xl flex items-center justify-center shadow-sm">
              <Search size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Manual Search</h3>
              <p className="text-sm text-gray-500 mt-1">If the patient doesn't have a QR code, search by name or ID.</p>
            </div>
            <Button variant="outline" disabled className="w-full">Search Patient Database</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={handleCheckin} className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-right-4 duration-300">
          {/* Patient Card */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6 sticky top-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold">
                  {patient?.name?.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{patient?.name}</h3>
                  <p className="text-xs text-gray-500 uppercase tracking-widest font-mono">#{patient?.id.slice(-8)}</p>
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t border-gray-50">
                <p className="text-sm text-gray-600 flex justify-between">
                  <span className="font-medium">Blood Group:</span>
                  <span className="text-red-600 font-bold">{patient?.bloodGroup || "N/A"}</span>
                </p>
                <p className="text-sm text-gray-600 flex justify-between">
                  <span className="font-medium">LDAP ID:</span>
                  <span className="font-mono">{patient?.user?.ldapId}</span>
                </p>
              </div>
              <Button variant="ghost" type="button" onClick={resetForm} className="w-full text-xs text-red-500 hover:bg-red-50">
                Cancel & Change Patient
              </Button>
            </div>
          </div>

          {/* Visit Details & Vitals */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-8">
              <section className="space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Stethoscope size={18} className="text-blue-600" />
                  Visit Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Visit Type</label>
                    <select 
                      className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none appearance-none"
                      value={formData.visitType}
                      onChange={(e) => setFormData({...formData, visitType: e.target.value})}
                    >
                      <option value="OPD">OPD Consultation</option>
                      <option value="EMERGENCY">Emergency Case</option>
                      <option value="ADMIT">PHC Admission</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Assign Doctor (Optional)</label>
                    <select 
                      className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none appearance-none"
                      value={formData.doctorId}
                      onChange={(e) => setFormData({...formData, doctorId: e.target.value})}
                    >
                      <option value="">Auto-assign or next available...</option>
                      {doctors.map(doc => (
                        <option key={doc.id} value={doc.id}>
                          Dr. {doc.name} ({doc.specialization || doc.doctorType})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Activity size={18} className="text-rose-500" />
                  Vital Signs
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input 
                    label="Weight (kg)" 
                    placeholder="70.5" 
                    type="number" 
                    step="0.1"
                    icon={Weight}
                    value={formData.weight}
                    onChange={(e) => setFormData({...formData, weight: e.target.value})}
                  />
                  <Input 
                    label="Temperature (°F)" 
                    placeholder="98.6" 
                    type="number" 
                    step="0.1"
                    icon={Thermometer}
                    value={formData.temperature}
                    onChange={(e) => setFormData({...formData, temperature: e.target.value})}
                  />
                  <Input 
                    label="Blood Pressure" 
                    placeholder="120/80" 
                    icon={Activity}
                    value={formData.bloodPressure}
                    onChange={(e) => setFormData({...formData, bloodPressure: e.target.value})}
                  />
                </div>
              </section>

              <div className="pt-4">
                <Button type="submit" className="w-full h-12 text-lg font-bold" isLoading={loading}>
                  Complete Check-in & Queue Visit
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default PatientCheckin;
