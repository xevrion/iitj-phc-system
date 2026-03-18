import { useState } from "react";
import { api } from "../../api/endpoints";
import { useApiAction } from "../../hooks/useApiAction";
import { Button, Card, Field, Grid, Input, JsonPanel, Page, Select } from "../../components/Ui";

export default function DocumentsPage() {
  const action = useApiAction(async ({ type, payload }) => {
    if (type === "list") return api.documents.list(payload.patientId);
    if (type === "upload") return api.documents.upload(payload.patientId, payload.body);
    return null;
  });

  const [patientId, setPatientId] = useState("");
  const [visitId, setVisitId] = useState("");
  const [documentType, setDocumentType] = useState("PRESCRIPTION");
  const [fileUrl, setFileUrl] = useState("");

  return (
    <Page title="Documents" subtitle="/patients/:id/documents">
      <Grid>
        <Card title="List Documents">
          <Field label="Patient ID"><Input value={patientId} onChange={(e) => setPatientId(e.target.value)} /></Field>
          <Button onClick={() => action.run({ type: "list", payload: { patientId } })} disabled={!patientId}>Fetch</Button>
        </Card>

        <Card title="Upload Document">
          <Field label="Patient ID"><Input value={patientId} onChange={(e) => setPatientId(e.target.value)} /></Field>
          <Field label="Visit ID (optional)"><Input value={visitId} onChange={(e) => setVisitId(e.target.value)} /></Field>
          <Field label="Document Type">
            <Select value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
              <option>PRESCRIPTION</option>
              <option>LAB_REPORT</option>
              <option>DISCHARGE</option>
            </Select>
          </Field>
          <Field label="File URL"><Input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} /></Field>
          <Button
            onClick={() =>
              action.run({
                type: "upload",
                payload: {
                  patientId,
                  body: { documentType, fileUrl, ...(visitId ? { visitId } : {}) },
                },
              })
            }
            disabled={!patientId || !fileUrl}
          >
            Upload
          </Button>
        </Card>
      </Grid>

      <Card title="Response">{action.error ? <p className="text-sm text-rose-600">{action.error}</p> : <JsonPanel data={action.result} />}</Card>
    </Page>
  );
}
