import React, { useState, useEffect } from "react";
import { Search, User, QrCode, Eye, Loader2, AlertCircle } from "lucide-react";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import { cn } from "../../../utils/cn";
import { identifyPatientByQR, getPatientById } from "../services/reception.service";

const PatientsList = () => {
  const [qrInput, setQrInput] = useState("");
  const [patient, setPatient] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!qrInput.trim()) return;
    setLoading(true);
    setError("");
    setPatient(null);
    setVisits([]);
    try {
      const res = await identifyPatientByQR(qrInput.trim());
      if (res.success) {
        setPatient(res.data);
        const visitsRes = await import("../services/reception.service").then(m =>
          m.getPatientVisits(res.data.id)
        );
        if (visitsRes.success) setVisits(visitsRes.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "No patient found with this QR code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Patient Lookup</h1>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 max-w-lg">
        <div className="relative flex-1">
          <Input
            placeholder="Enter patient QR code..."
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value)}
            className="pl-10"
          />
          <QrCode className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
        </div>
        <Button type="submit" isLoading={loading}>
          Search
        </Button>
      </form>

      {error && (
        <div className="flex gap-3 items-center p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
          <AlertCircle size={18} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {patient && (
        <div className="space-y-6">
          {/* Patient Card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold shrink-0">
              {patient.name?.charAt(0)}
            </div>
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Name</p>
                <p className="text-sm font-semibold text-gray-900">{patient.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Blood Group</p>
                <p className="text-sm font-bold text-red-600">{patient.bloodGroup || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Phone</p>
                <p className="text-sm text-gray-700">{patient.phone || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Email</p>
                <p className="text-sm text-gray-700 truncate">{patient.email || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Visit History */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Visit History</h2>
              <span className="text-xs text-gray-400">{visits.length} total visits</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Doctor</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {visits.map(v => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-sm text-gray-700">
                        {new Date(v.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-700">{v.visitType}</td>
                      <td className="px-5 py-3 text-sm text-gray-700">{v.doctor?.name || "Unassigned"}</td>
                      <td className="px-5 py-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-bold",
                          v.visitStatus === "COMPLETED" ? "bg-emerald-100 text-emerald-700" :
                          v.visitStatus === "CANCELLED" ? "bg-red-100 text-red-700" :
                          v.visitStatus === "IN_CONSULTATION" ? "bg-blue-100 text-blue-700" :
                          "bg-amber-100 text-amber-700"
                        )}>
                          {v.visitStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {visits.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-5 py-8 text-center text-gray-400 text-sm">No visits found for this patient.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!patient && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <User size={28} className="text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">Enter a QR code above to look up a patient.</p>
        </div>
      )}
    </div>
  );
};

export default PatientsList;
