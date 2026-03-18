import { useState } from "react";
import { api } from "../../api/endpoints";
import { useApiAction } from "../../hooks/useApiAction";
import { Button, Card, Field, Grid, Input, JsonPanel, Page, Textarea } from "../../components/Ui";

export default function PrescriptionsPage() {
  const action = useApiAction(async ({ type, payload }) => {
    if (type === "create") return api.prescriptions.create(payload.visitId, payload.body);
    if (type === "visit") return api.prescriptions.byVisit(payload.visitId);
    if (type === "pending") return api.prescriptions.pending();
    if (type === "dispense") return api.prescriptions.dispense(payload.id);
    return null;
  });

  const [visitId, setVisitId] = useState("");
  const [prescriptionId, setPrescriptionId] = useState("");
  const [notes, setNotes] = useState("");
  const [itemsJson, setItemsJson] = useState('[{"medicineId":"", "dosage":"", "duration":""}]');

  return (
    <Page title="Prescriptions" subtitle="/visits/:visitId/prescription + /prescriptions/*">
      <Card title="Create Prescription">
        <Field label="Visit ID"><Input value={visitId} onChange={(e) => setVisitId(e.target.value)} /></Field>
        <Field label="Notes"><Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        <Field label="Items JSON"><Textarea rows={5} value={itemsJson} onChange={(e) => setItemsJson(e.target.value)} /></Field>
        <Button
          onClick={() =>
            action.run({
              type: "create",
              payload: { visitId, body: { notes, items: JSON.parse(itemsJson) } },
            })
          }
          disabled={!visitId}
        >
          Create
        </Button>
      </Card>

      <Grid>
        <Card title="Get Prescription By Visit">
          <Field label="Visit ID"><Input value={visitId} onChange={(e) => setVisitId(e.target.value)} /></Field>
          <Button onClick={() => action.run({ type: "visit", payload: { visitId } })} disabled={!visitId}>Fetch</Button>
        </Card>
        <Card title="Pending Prescriptions">
          <Button onClick={() => action.run({ type: "pending" })}>Fetch</Button>
        </Card>
      </Grid>

      <Card title="Dispense Prescription">
        <Field label="Prescription ID"><Input value={prescriptionId} onChange={(e) => setPrescriptionId(e.target.value)} /></Field>
        <Button onClick={() => action.run({ type: "dispense", payload: { id: prescriptionId } })} disabled={!prescriptionId}>Mark Dispensed</Button>
      </Card>

      <Card title="Response">{action.error ? <p className="text-sm text-rose-600">{action.error}</p> : <JsonPanel data={action.result} />}</Card>
    </Page>
  );
}
