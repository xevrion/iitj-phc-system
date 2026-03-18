import { useState } from "react";
import { api } from "../../api/endpoints";
import { useApiAction } from "../../hooks/useApiAction";
import { Button, Card, Field, Grid, Input, JsonPanel, Page } from "../../components/Ui";

export default function LabPage() {
  const action = useApiAction(async ({ type, payload }) => {
    if (type === "create") return api.lab.create(payload.visitId, { testName: payload.testName });
    if (type === "visit") return api.lab.byVisit(payload.visitId);
    if (type === "pending") return api.lab.pending();
    if (type === "upload") return api.lab.uploadReport(payload.id, { reportUrl: payload.reportUrl });
    return null;
  });

  const [visitId, setVisitId] = useState("");
  const [testName, setTestName] = useState("");
  const [requestId, setRequestId] = useState("");
  const [reportUrl, setReportUrl] = useState("");

  return (
    <Page title="Lab" subtitle="/visits/:visitId/lab-requests + /lab-requests/*">
      <Grid>
        <Card title="Create Lab Request">
          <Field label="Visit ID"><Input value={visitId} onChange={(e) => setVisitId(e.target.value)} /></Field>
          <Field label="Test Name"><Input value={testName} onChange={(e) => setTestName(e.target.value)} /></Field>
          <Button onClick={() => action.run({ type: "create", payload: { visitId, testName } })} disabled={!visitId || !testName}>Create</Button>
        </Card>
        <Card title="Get Lab Requests By Visit">
          <Field label="Visit ID"><Input value={visitId} onChange={(e) => setVisitId(e.target.value)} /></Field>
          <Button onClick={() => action.run({ type: "visit", payload: { visitId } })} disabled={!visitId}>Fetch</Button>
        </Card>
      </Grid>

      <Grid>
        <Card title="Pending Lab Requests"><Button onClick={() => action.run({ type: "pending" })}>Fetch</Button></Card>
        <Card title="Upload Lab Report">
          <Field label="Lab Request ID"><Input value={requestId} onChange={(e) => setRequestId(e.target.value)} /></Field>
          <Field label="Report URL"><Input value={reportUrl} onChange={(e) => setReportUrl(e.target.value)} /></Field>
          <Button onClick={() => action.run({ type: "upload", payload: { id: requestId, reportUrl } })} disabled={!requestId || !reportUrl}>Upload</Button>
        </Card>
      </Grid>

      <Card title="Response">{action.error ? <p className="text-sm text-rose-600">{action.error}</p> : <JsonPanel data={action.result} />}</Card>
    </Page>
  );
}
