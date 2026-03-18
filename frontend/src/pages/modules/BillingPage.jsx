import { useState } from "react";
import { api } from "../../api/endpoints";
import { useApiAction } from "../../hooks/useApiAction";
import { Button, Card, Field, Grid, Input, JsonPanel, Page, Textarea } from "../../components/Ui";

export default function BillingPage() {
  const action = useApiAction(async ({ type, payload }) => {
    if (type === "create") return api.billing.create(payload.visitId, payload.body);
    if (type === "byVisit") return api.billing.byVisit(payload.visitId);
    if (type === "unpaid") return api.billing.unpaid();
    if (type === "pay") return api.billing.pay(payload.billId);
    return null;
  });

  const [visitId, setVisitId] = useState("");
  const [billId, setBillId] = useState("");
  const [itemsJson, setItemsJson] = useState('[{"medicineId":"", "quantity":1}]');

  return (
    <Page title="Billing" subtitle="/visits/:visitId/bill + /bills/*">
      <Grid>
        <Card title="Generate Bill">
          <Field label="Visit ID"><Input value={visitId} onChange={(e) => setVisitId(e.target.value)} /></Field>
          <Field label="Items JSON"><Textarea rows={5} value={itemsJson} onChange={(e) => setItemsJson(e.target.value)} /></Field>
          <Button onClick={() => action.run({ type: "create", payload: { visitId, body: { items: JSON.parse(itemsJson) } } })} disabled={!visitId}>Create</Button>
        </Card>
        <Card title="Get Bill By Visit">
          <Field label="Visit ID"><Input value={visitId} onChange={(e) => setVisitId(e.target.value)} /></Field>
          <Button onClick={() => action.run({ type: "byVisit", payload: { visitId } })} disabled={!visitId}>Fetch</Button>
        </Card>
      </Grid>

      <Grid>
        <Card title="List Unpaid Bills"><Button onClick={() => action.run({ type: "unpaid" })}>Fetch</Button></Card>
        <Card title="Mark Bill Paid">
          <Field label="Bill ID"><Input value={billId} onChange={(e) => setBillId(e.target.value)} /></Field>
          <Button onClick={() => action.run({ type: "pay", payload: { billId } })} disabled={!billId}>Mark Paid</Button>
        </Card>
      </Grid>

      <Card title="Response">{action.error ? <p className="text-sm text-rose-600">{action.error}</p> : <JsonPanel data={action.result} />}</Card>
    </Page>
  );
}
