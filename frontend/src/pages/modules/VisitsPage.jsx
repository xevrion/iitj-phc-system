import { useState } from "react";
import { api } from "../../api/endpoints";
import { useApiAction } from "../../hooks/useApiAction";
import { Button, Card, Field, Grid, Input, JsonPanel, Page, Select, Textarea } from "../../components/Ui";

export default function VisitsPage() {
  const action = useApiAction(async ({ type, payload }) => {
    if (type === "create") return api.visits.create(payload);
    if (type === "queue") return api.visits.myQueue();
    if (type === "byId") return api.visits.byId(payload.id);
    if (type === "vitals") return api.visits.vitals(payload.id, payload.vitals);
    if (type === "claim") return api.visits.claim(payload.id);
    if (type === "consultation") return api.visits.consultation(payload.id, payload.consultationNotes);
    if (type === "complete") return api.visits.complete(payload.id);
    if (type === "cancel") return api.visits.cancel(payload.id);
    return null;
  });

  const [visitId, setVisitId] = useState("");
  const [createForm, setCreateForm] = useState({ patientId: "", doctorId: "", visitType: "OPD", weight: "", temperature: "", bloodPressure: "" });
  const [vitals, setVitals] = useState({ weight: "", temperature: "", bloodPressure: "" });
  const [consultationNotes, setConsultationNotes] = useState("");

  return (
    <Page title="Visits" subtitle="/visits/* APIs">
      <Card title="Create Visit">
        <Grid>
          <Field label="Patient ID"><Input value={createForm.patientId} onChange={(e) => setCreateForm({ ...createForm, patientId: e.target.value })} /></Field>
          <Field label="Doctor ID (optional)"><Input value={createForm.doctorId} onChange={(e) => setCreateForm({ ...createForm, doctorId: e.target.value })} /></Field>
          <Field label="Visit Type"><Select value={createForm.visitType} onChange={(e) => setCreateForm({ ...createForm, visitType: e.target.value })}><option>OPD</option><option>ADMIT</option><option>EMERGENCY</option></Select></Field>
          <Field label="Weight"><Input type="number" value={createForm.weight} onChange={(e) => setCreateForm({ ...createForm, weight: e.target.value })} /></Field>
          <Field label="Temperature"><Input type="number" value={createForm.temperature} onChange={(e) => setCreateForm({ ...createForm, temperature: e.target.value })} /></Field>
          <Field label="Blood Pressure"><Input value={createForm.bloodPressure} onChange={(e) => setCreateForm({ ...createForm, bloodPressure: e.target.value })} /></Field>
        </Grid>
        <Button
          onClick={() =>
            action.run({
              type: "create",
              payload: {
                patientId: createForm.patientId,
                doctorId: createForm.doctorId || undefined,
                visitType: createForm.visitType,
                vitals: {
                  weight: createForm.weight ? Number(createForm.weight) : null,
                  temperature: createForm.temperature ? Number(createForm.temperature) : null,
                  bloodPressure: createForm.bloodPressure || null,
                },
              },
            })
          }
        >
          Create
        </Button>
      </Card>

      <Grid>
        <Card title="My Queue"><Button onClick={() => action.run({ type: "queue" })}>Fetch</Button></Card>
        <Card title="Visit By ID">
          <Field label="Visit ID"><Input value={visitId} onChange={(e) => setVisitId(e.target.value)} /></Field>
          <Button onClick={() => action.run({ type: "byId", payload: { id: visitId } })} disabled={!visitId}>Fetch</Button>
        </Card>
      </Grid>

      <Card title="Visit Actions By ID">
        <Field label="Visit ID"><Input value={visitId} onChange={(e) => setVisitId(e.target.value)} /></Field>
        <Grid>
          <div className="space-y-2">
            <Field label="Weight"><Input type="number" value={vitals.weight} onChange={(e) => setVitals({ ...vitals, weight: e.target.value })} /></Field>
            <Field label="Temperature"><Input type="number" value={vitals.temperature} onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })} /></Field>
            <Field label="Blood Pressure"><Input value={vitals.bloodPressure} onChange={(e) => setVitals({ ...vitals, bloodPressure: e.target.value })} /></Field>
            <Button onClick={() => action.run({ type: "vitals", payload: { id: visitId, vitals: { weight: vitals.weight ? Number(vitals.weight) : null, temperature: vitals.temperature ? Number(vitals.temperature) : null, bloodPressure: vitals.bloodPressure || null } } })} disabled={!visitId}>Record Vitals</Button>
          </div>
          <div className="space-y-2">
            <Field label="Consultation Notes"><Textarea rows={4} value={consultationNotes} onChange={(e) => setConsultationNotes(e.target.value)} /></Field>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => action.run({ type: "claim", payload: { id: visitId } })} disabled={!visitId}>Claim</Button>
              <Button onClick={() => action.run({ type: "consultation", payload: { id: visitId, consultationNotes } })} disabled={!visitId}>Save Notes</Button>
              <Button onClick={() => action.run({ type: "complete", payload: { id: visitId } })} disabled={!visitId}>Complete</Button>
              <Button variant="danger" onClick={() => action.run({ type: "cancel", payload: { id: visitId } })} disabled={!visitId}>Cancel</Button>
            </div>
          </div>
        </Grid>
      </Card>

      <Card title="Response">{action.error ? <p className="text-sm text-rose-600">{action.error}</p> : <JsonPanel data={action.result} />}</Card>
    </Page>
  );
}
