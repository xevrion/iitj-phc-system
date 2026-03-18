import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/endpoints";
import { Button, Card, Notice, Page } from "../../components/Ui";
import { DataTable, EmptyState } from "../../components/patient/PatientWidgets";
import { usePatientProfile } from "../../hooks/usePatientProfile";

function formatDateTime(value) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function PatientRecordsPage() {
  const { profile, loading: profileLoading, error: profileError } = usePatientProfile();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedVisitId, setSelectedVisitId] = useState("");
  const [details, setDetails] = useState(null);
  const [prescription, setPrescription] = useState(null);
  const [labRequests, setLabRequests] = useState([]);
  const [bill, setBill] = useState(null);
  const [detailError, setDetailError] = useState("");

  const loadHistory = async (patientId) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.patients.visitHistory(patientId);
      setVisits(res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load visit history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      loadHistory(profile.id);
    }
  }, [profile?.id]);

  const loadVisitBundle = async (visitId) => {
    setSelectedVisitId(visitId);
    setDetailError("");
    setDetails(null);
    setPrescription(null);
    setLabRequests([]);
    setBill(null);

    try {
      const [v, p, l, b] = await Promise.allSettled([
        api.visits.byId(visitId),
        api.prescriptions.byVisit(visitId),
        api.lab.byVisit(visitId),
        api.billing.byVisit(visitId),
      ]);

      if (v.status === "fulfilled") setDetails(v.value.data);
      if (p.status === "fulfilled") setPrescription(p.value.data);
      if (l.status === "fulfilled") setLabRequests(l.value.data || []);
      if (b.status === "fulfilled") setBill(b.value.data);

      if (v.status === "rejected") {
        setDetailError(v.reason?.message || "Unable to load selected visit details");
      }
    } catch (err) {
      setDetailError(err.message || "Unable to load selected visit details");
    }
  };

  const vitalsSummary = useMemo(() => {
    if (!details?.vitals) return "No vitals recorded";
    const { weight, temperature, bloodPressure } = details.vitals;
    return `Weight: ${weight ?? "-"}, Temp: ${temperature ?? "-"}, BP: ${bloodPressure ?? "-"}`;
  }, [details]);

  return (
    <Page title="Medical Records" subtitle="View visit history and per-visit clinical artifacts.">
      {profileError ? <Notice kind="error">{profileError}</Notice> : null}
      {error ? <Notice kind="error">{error}</Notice> : null}

      <Card title="Visit History">
        {profileLoading || loading ? (
          <p className="text-sm text-slate-500">Loading visit history...</p>
        ) : visits.length === 0 ? (
          <EmptyState title="No visit history" description="Visits will appear here after check-in or consultation." />
        ) : (
          <DataTable
            columns={[
              { key: "id", label: "Visit ID" },
              { key: "createdAt", label: "Created", render: (row) => formatDateTime(row.createdAt) },
              { key: "visitType", label: "Type" },
              { key: "visitStatus", label: "Status" },
              { key: "doctor", label: "Doctor", render: (row) => row.doctor?.name || "Unassigned" },
              {
                key: "actions",
                label: "Actions",
                render: (row) => (
                  <Button className="px-2 py-1 text-xs" onClick={() => loadVisitBundle(row.id)}>
                    View Details
                  </Button>
                ),
              },
            ]}
            rows={visits}
          />
        )}
      </Card>

      <Card title="Selected Visit Details">
        {!selectedVisitId ? (
          <p className="text-sm text-slate-500">Pick a visit from history to inspect details.</p>
        ) : detailError ? (
          <Notice kind="error">{detailError}</Notice>
        ) : details ? (
          <div className="space-y-3 text-sm text-slate-700">
            <div><strong>Visit ID:</strong> {details.id}</div>
            <div><strong>Status:</strong> {details.visitStatus}</div>
            <div><strong>Type:</strong> {details.visitType}</div>
            <div><strong>Doctor:</strong> {details.doctor?.name || "Unassigned"}</div>
            <div><strong>Vitals:</strong> {vitalsSummary}</div>
            <div><strong>Consultation Notes:</strong> {details.consultationNotes || "No notes"}</div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Loading details...</p>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Prescription">
          {!selectedVisitId ? (
            <p className="text-sm text-slate-500">No visit selected.</p>
          ) : prescription ? (
            <div className="space-y-2 text-sm text-slate-700">
              <div><strong>Status:</strong> {prescription.isDispensed ? "Dispensed" : "Pending"}</div>
              <div><strong>Doctor:</strong> {prescription.doctor?.name || "-"}</div>
              <div><strong>Notes:</strong> {prescription.notes || "-"}</div>
              <div>
                <strong>Medicines:</strong>
                <ul className="mt-1 list-disc pl-5">
                  {prescription.items?.map((item) => (
                    <li key={item.id}>
                      {item.medicine?.name} ({item.dosage || "-"}, {item.duration || "-"})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No prescription found for this visit.</p>
          )}
        </Card>

        <Card title="Lab Requests">
          {!selectedVisitId ? (
            <p className="text-sm text-slate-500">No visit selected.</p>
          ) : labRequests.length > 0 ? (
            <ul className="space-y-2 text-sm text-slate-700">
              {labRequests.map((req) => (
                <li key={req.id} className="rounded-md border border-slate-200 p-2">
                  <div><strong>{req.testName}</strong></div>
                  <div>Status: {req.status}</div>
                  <div>Report: {req.report?.reportUrl || "Not uploaded"}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No lab requests found for this visit.</p>
          )}
        </Card>

        <Card title="Billing">
          {!selectedVisitId ? (
            <p className="text-sm text-slate-500">No visit selected.</p>
          ) : bill ? (
            <div className="space-y-2 text-sm text-slate-700">
              <div><strong>Bill ID:</strong> {bill.id}</div>
              <div><strong>Total:</strong> {bill.totalAmount}</div>
              <div><strong>Payment:</strong> {bill.paymentStatus}</div>
              <div>
                <strong>Items:</strong>
                <ul className="mt-1 list-disc pl-5">
                  {bill.items?.map((item) => (
                    <li key={item.id}>
                      {item.medicine?.name || item.medicineId} x {item.quantity}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No bill found for this visit.</p>
          )}
        </Card>
      </div>
    </Page>
  );
}
