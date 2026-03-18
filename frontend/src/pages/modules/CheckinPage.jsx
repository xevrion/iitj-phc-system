import { useState } from "react";
import { api } from "../../api/endpoints";
import { useApiAction } from "../../hooks/useApiAction";
import { Button, Card, Field, Input, JsonPanel, Page, Select } from "../../components/Ui";

export default function CheckinPage() {
  const action = useApiAction(api.checkin.create);
  const [form, setForm] = useState({ qrCode: "", visitType: "OPD", weight: "", temperature: "", bloodPressure: "" });

  return (
    <Page title="QR Check-in" subtitle="POST /checkin">
      <Card title="Reception QR Check-in">
        <Field label="QR Code"><Input value={form.qrCode} onChange={(e) => setForm({ ...form, qrCode: e.target.value })} /></Field>
        <Field label="Visit Type">
          <Select value={form.visitType} onChange={(e) => setForm({ ...form, visitType: e.target.value })}>
            <option>OPD</option><option>ADMIT</option><option>EMERGENCY</option>
          </Select>
        </Field>
        <Field label="Weight"><Input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} /></Field>
        <Field label="Temperature"><Input type="number" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: e.target.value })} /></Field>
        <Field label="Blood Pressure"><Input value={form.bloodPressure} onChange={(e) => setForm({ ...form, bloodPressure: e.target.value })} /></Field>
        <Button onClick={() => action.run({ qrCode: form.qrCode, visitType: form.visitType, vitals: { weight: form.weight ? Number(form.weight) : null, temperature: form.temperature ? Number(form.temperature) : null, bloodPressure: form.bloodPressure || null } })} disabled={!form.qrCode}>Check In</Button>
      </Card>
      <Card title="Response">{action.error ? <p className="text-sm text-rose-600">{action.error}</p> : <JsonPanel data={action.result} />}</Card>
    </Page>
  );
}
