import React, { useEffect, useState } from "react";
import { Loader2, Thermometer, HeartPulse, ClipboardCheck } from "lucide-react";
import Button from "../../../components/ui/Button";
import { getDoctorQueue, claimVisit } from "../services/doctor.service";

const DoctorQueue = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchQueue = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getDoctorQueue();
      setQueue(response.success ? response.data : []);
      setLastUpdated(new Date());
    } catch {
      setError("Unable to load waiting queue right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleClaim = async (visitId) => {
    setClaimingId(visitId);
    setError("");
    try {
      await claimVisit(visitId);
      await fetchQueue();
    } catch {
      setError("Could not claim this visit. It may already be in consultation.");
    } finally {
      setClaimingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-gray-500 font-medium">Loading waiting queue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctor Queue</h1>
          <p className="text-gray-500">Patients waiting for consultation: {queue.length}</p>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-1">Updated {lastUpdated.toLocaleTimeString("en-IN")}</p>
          )}
        </div>
        <Button variant="outline" onClick={fetchQueue}>Refresh</Button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Visit Type</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Vitals</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Queued At</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {queue.map((visit) => (
                <tr key={visit.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-gray-900">{visit.patient?.name || "Unknown"}</p>
                    <p className="text-xs text-gray-500">Visit ID: {visit.id.slice(-8)}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{visit.visitType}</td>
                  <td className="px-6 py-4 text-xs text-gray-600">
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex items-center gap-1">
                        <HeartPulse size={14} className="text-rose-500" />
                        BP: {visit.vitals?.bloodPressure || "NA"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Thermometer size={14} className="text-amber-500" />
                        Temp: {visit.vitals?.temperature ?? "NA"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(visit.createdAt).toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      size="sm"
                      onClick={() => handleClaim(visit.id)}
                      isLoading={claimingId === visit.id}
                      className="gap-2"
                    >
                      <ClipboardCheck size={14} />
                      Claim Visit
                    </Button>
                  </td>
                </tr>
              ))}
              {queue.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No patients are currently waiting in your queue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DoctorQueue;
