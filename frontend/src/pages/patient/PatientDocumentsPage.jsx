import { useEffect, useState } from "react";
import { api } from "../../api/endpoints";
import { Button, Card, Field, Grid, Input, Notice, Page, Select } from "../../components/Ui";
import { DataTable, EmptyState } from "../../components/patient/PatientWidgets";
import { usePatientProfile } from "../../hooks/usePatientProfile";

function formatDateTime(value) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function PatientDocumentsPage() {
  const { profile, loading: profileLoading, error: profileError } = usePatientProfile();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    documentType: "LAB_REPORT",
    fileUrl: "",
    visitId: "",
  });

  const loadDocuments = async (patientId) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.documents.list(patientId);
      setDocuments(res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      loadDocuments(profile.id);
    }
  }, [profile?.id]);

  const onUpload = async () => {
    if (!profile?.id) return;
    setMessage("");
    setError("");

    try {
      await api.documents.upload(profile.id, {
        documentType: form.documentType,
        fileUrl: form.fileUrl,
        ...(form.visitId ? { visitId: form.visitId } : {}),
      });
      setMessage("Document uploaded.");
      setForm({ ...form, fileUrl: "", visitId: "" });
      await loadDocuments(profile.id);
    } catch (err) {
      setError(err.message || "Failed to upload document");
    }
  };

  return (
    <Page title="Documents" subtitle="Maintain external clinical documents tied to your profile.">
      {profileError ? <Notice kind="error">{profileError}</Notice> : null}
      {error ? <Notice kind="error">{error}</Notice> : null}
      {message ? <Notice kind="success">{message}</Notice> : null}

      <Card title="Upload Document">
        <Grid>
          <Field label="Document Type">
            <Select value={form.documentType} onChange={(e) => setForm({ ...form, documentType: e.target.value })}>
              <option value="PRESCRIPTION">Prescription</option>
              <option value="LAB_REPORT">Lab Report</option>
              <option value="DISCHARGE">Discharge</option>
            </Select>
          </Field>
          <Field label="File URL"><Input value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} placeholder="https://..." /></Field>
          <Field label="Visit ID (optional)"><Input value={form.visitId} onChange={(e) => setForm({ ...form, visitId: e.target.value })} /></Field>
        </Grid>
        <div className="flex gap-2">
          <Button onClick={onUpload} disabled={!form.fileUrl || profileLoading}>Upload</Button>
          <Button variant="secondary" onClick={() => profile?.id && loadDocuments(profile.id)}>Refresh</Button>
        </div>
      </Card>

      <Card title="My Documents">
        {profileLoading || loading ? (
          <p className="text-sm text-slate-500">Loading documents...</p>
        ) : documents.length === 0 ? (
          <EmptyState
            title="No documents yet"
            description="Upload files like lab reports or discharge documents to maintain your record."
          />
        ) : (
          <DataTable
            columns={[
              { key: "documentType", label: "Type" },
              { key: "fileUrl", label: "File", render: (row) => <a className="text-sky-700 underline" href={row.fileUrl} target="_blank" rel="noreferrer">Open</a> },
              { key: "visitId", label: "Visit ID", render: (row) => row.visitId || "-" },
              { key: "uploadedAt", label: "Uploaded", render: (row) => formatDateTime(row.uploadedAt) },
            ]}
            rows={documents}
          />
        )}
      </Card>
    </Page>
  );
}
