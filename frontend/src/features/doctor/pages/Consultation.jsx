import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { 
  User, 
  Activity, 
  ClipboardText, 
  Pill, 
  FlaskConical, 
  Save, 
  CheckCircle2, 
  ChevronLeft,
  Loader2,
  Plus,
  Trash2,
  AlertCircle
} from "lucide-react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { cn } from "../../../utils/cn";
import { 
  getVisitById, 
  saveConsultationNotes, 
  createPrescription, 
  createLabRequest, 
  completeVisit,
  getMedicines
} from "../services/doctor.service";

const Consultation = () => {
  const { visitId } = useParams();
  const navigate = useNavigate();
  
  const [visit, setVisit] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Consultation State
  const [notes, setNotes] = useState("");
  const [prescriptionItems, setPrescriptionItems] = useState([]);
  const [labTests, setLabTests] = useState([]);
  
  // UI State
  const [activeTab, setActiveTab] = useState("notes"); // notes, prescription, lab

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vRes, mRes] = await Promise.all([
          getVisitById(visitId),
          getMedicines()
        ]);
        
        if (vRes.success) {
          setVisit(vRes.data);
          setNotes(vRes.data.consultationNotes || "");
        }
        if (mRes.success) {
          setMedicines(mRes.data);
        }
      } catch (err) {
        setError("Failed to load consultation data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [visitId]);

  const handleAddMedicine = () => {
    setPrescriptionItems([...prescriptionItems, { medicineId: "", dosage: "", duration: "" }]);
  };

  const handleRemoveMedicine = (index) => {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index, field, value) => {
    const updated = [...prescriptionItems];
    updated[index][field] = value;
    setPrescriptionItems(updated);
  };

  const handleAddLabTest = (testName) => {
    if (!testName.trim()) return;
    setLabTests([...labTests, testName.trim()]);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    
    try {
      // 1. Save Notes
      await saveConsultationNotes(visitId, notes);
      
      // 2. Save Prescription if items exist
      if (prescriptionItems.length > 0) {
        await createPrescription(visitId, {
          notes: "Prescribed during consultation",
          items: prescriptionItems.filter(item => item.medicineId)
        });
      }
      
      // 3. Save Lab Requests
      for (const test of labTests) {
        await createLabRequest(visitId, test);
      }
      
      setSuccess("Consultation data saved successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save consultation details.");
    } finally {
      setSaving(false);
    }
  };

  const handleFinishConsultation = async () => {
    if (!window.confirm("Are you sure you want to complete this consultation? This will close the visit.")) return;
    
    setSaving(true);
    try {
      await handleSaveAll();
      const res = await completeVisit(visitId);
      if (res.success) {
        navigate("/doctor/queue");
      }
    } catch (err) {
      setError("Failed to complete consultation.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-gray-500 font-medium">Loading patient consultation...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/doctor/queue")} className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-400">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Consultation: {visit?.patient?.name}
            </h1>
            <p className="text-gray-500 text-sm">Visit ID: {visitId.slice(-8).toUpperCase()} • {visit?.visitType} Case</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleSaveAll} isLoading={saving} className="gap-2">
            <Save size={18} /> Save Progress
          </Button>
          <Button onClick={handleFinishConsultation} isLoading={saving} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <CheckCircle2 size={18} /> Finish & Complete
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex gap-3 items-center">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 flex gap-3 items-center">
          <CheckCircle2 size={20} />
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Patient Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div className="text-center pb-6 border-b border-gray-50">
              <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                {visit?.patient?.name?.charAt(0)}
              </div>
              <h3 className="font-bold text-gray-900">{visit?.patient?.name}</h3>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Patient Details</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Activity size={18} className="text-rose-500" />
                <div>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Vitals</p>
                  <p className="text-gray-700 font-medium">BP: {visit?.vitals?.bloodPressure || "N/A"}</p>
                  <p className="text-gray-700 font-medium">Temp: {visit?.vitals?.temperature}°F</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <User size={18} className="text-blue-500" />
                <div>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Blood Group</p>
                  <p className="text-gray-700 font-medium">{visit?.patient?.bloodGroup || "Unknown"}</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-50">
              <Button variant="ghost" className="w-full text-blue-600 hover:bg-blue-50 text-xs font-bold uppercase tracking-wider">
                View Full Medical History
              </Button>
            </div>
          </div>
        </div>

        {/* Main Work Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Tabs */}
          <div className="bg-white p-1 rounded-xl border border-gray-100 shadow-sm flex gap-1">
            {[
              { id: "notes", label: "Clinical Notes", icon: ClipboardText },
              { id: "prescription", label: "Prescription", icon: Pill },
              { id: "lab", label: "Lab Requests", icon: FlaskConical }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all",
                  activeTab === tab.id ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-gray-500 hover:bg-gray-50"
                )}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm min-h-[400px]">
            {activeTab === "notes" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Consultation Findings</h2>
                  <p className="text-xs text-gray-400">Autosave enabled</p>
                </div>
                <textarea
                  className="w-full min-h-[300px] p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-600 outline-none text-gray-700 leading-relaxed text-lg"
                  placeholder="Enter patient symptoms, diagnosis, and clinical observations here..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            )}

            {activeTab === "prescription" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Medication Orders</h2>
                  <Button size="sm" onClick={handleAddMedicine} className="gap-2">
                    <Plus size={16} /> Add Medicine
                  </Button>
                </div>

                <div className="space-y-4">
                  {prescriptionItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-gray-50 p-4 rounded-xl border border-gray-100 relative group">
                      <div className="md:col-span-5 space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Medicine Name</label>
                        <select
                          className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                          value={item.medicineId}
                          onChange={(e) => handleMedicineChange(idx, "medicineId", e.target.value)}
                        >
                          <option value="">Select medicine...</option>
                          {medicines.map(m => (
                            <option key={m.id} value={m.id}>{m.name} (Stock: {m.stockQuantity})</option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-3 space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dosage</label>
                        <input
                          type="text"
                          className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                          placeholder="e.g. 1-0-1"
                          value={item.dosage}
                          onChange={(e) => handleMedicineChange(idx, "dosage", e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-3 space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Duration</label>
                        <input
                          type="text"
                          className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                          placeholder="e.g. 5 days"
                          value={item.duration}
                          onChange={(e) => handleMedicineChange(idx, "duration", e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-1">
                        <button 
                          onClick={() => handleRemoveMedicine(idx)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {prescriptionItems.length === 0 && (
                    <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                      No medicines added to this prescription yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "lab" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Laboratory Investigations</h2>
                </div>

                <div className="flex gap-2">
                  <Input 
                    id="testNameInput"
                    placeholder="Search or enter test name (e.g. CBC, Blood Sugar)..." 
                    className="flex-1"
                  />
                  <Button onClick={() => {
                    const input = document.getElementById("testNameInput");
                    handleAddLabTest(input.value);
                    input.value = "";
                  }}>Add Test</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  {labTests.map((test, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-blue-50 text-blue-900 rounded-xl border border-blue-100 font-bold text-sm">
                      <div className="flex items-center gap-2">
                        <FlaskConical size={18} className="text-blue-500" />
                        {test}
                      </div>
                      <button 
                        onClick={() => setLabTests(labTests.filter((_, i) => i !== idx))}
                        className="text-blue-400 hover:text-blue-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                {labTests.length === 0 && (
                  <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                    No lab tests requested yet.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Consultation;
