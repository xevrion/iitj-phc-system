import { useState } from "react";
import { api } from "../../api/endpoints";
import { useApiAction } from "../../hooks/useApiAction";
import { Button, Card, Field, Grid, Input, JsonPanel, Page } from "../../components/Ui";

export default function PatientsPage() {
  const action = useApiAction(async ({ type, payload }) => {
    switch (type) {
      case "my":
        return api.patients.myProfile();
      case "update":
        return api.patients.updateMyProfile(payload);
      case "id":
        return api.patients.byId(payload.id);
      case "qr":
        return api.patients.byQr(payload.qrCode);
      case "history":
        return api.patients.visitHistory(payload.id);
      default:
        return null;
    }
  });

  const [patientId, setPatientId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [update, setUpdate] = useState({ name: "", phone: "", email: "", bloodGroup: "", address: "", dob: "" });

  return (
    <Page title="Patients" subtitle="/patients/* APIs">
      <Grid>
        <Card title="Get My Profile">
          <Button onClick={() => action.run({ type: "my" })} disabled={action.loading}>Fetch</Button>
        </Card>
        <Card title="Update My Profile">
          <Field label="Name"><Input value={update.name} onChange={(e) => setUpdate({ ...update, name: e.target.value })} /></Field>
          <Field label="Phone"><Input value={update.phone} onChange={(e) => setUpdate({ ...update, phone: e.target.value })} /></Field>
          <Field label="Email"><Input value={update.email} onChange={(e) => setUpdate({ ...update, email: e.target.value })} /></Field>
          <Field label="Blood Group"><Input value={update.bloodGroup} onChange={(e) => setUpdate({ ...update, bloodGroup: e.target.value })} /></Field>
          <Field label="Address"><Input value={update.address} onChange={(e) => setUpdate({ ...update, address: e.target.value })} /></Field>
          <Field label="DOB (YYYY-MM-DD)"><Input value={update.dob} onChange={(e) => setUpdate({ ...update, dob: e.target.value })} /></Field>
          <Button onClick={() => action.run({ type: "update", payload: update })} disabled={action.loading}>Submit</Button>
        </Card>
      </Grid>

      <Grid>
        <Card title="Get Patient By ID">
          <Field label="Patient ID"><Input value={patientId} onChange={(e) => setPatientId(e.target.value)} /></Field>
          <Button onClick={() => action.run({ type: "id", payload: { id: patientId } })} disabled={action.loading || !patientId}>Fetch</Button>
        </Card>
        <Card title="Get Patient By QR">
          <Field label="QR Code"><Input value={qrCode} onChange={(e) => setQrCode(e.target.value)} /></Field>
          <Button onClick={() => action.run({ type: "qr", payload: { qrCode } })} disabled={action.loading || !qrCode}>Fetch</Button>
        </Card>
      </Grid>

      <Card title="Patient Visit History">
        <Field label="Patient ID"><Input value={patientId} onChange={(e) => setPatientId(e.target.value)} /></Field>
        <Button onClick={() => action.run({ type: "history", payload: { id: patientId } })} disabled={action.loading || !patientId}>Fetch History</Button>
      </Card>

      <Card title="Response">
        {action.error ? <p className="text-sm text-rose-600">{action.error}</p> : <JsonPanel data={action.result} />}
      </Card>
    </Page>
  );
}
