import { useState } from "react";
import { api } from "../../api/endpoints";
import { useApiAction } from "../../hooks/useApiAction";
import { Button, Card, Field, Grid, Input, JsonPanel, Page } from "../../components/Ui";

export default function MedicinesPage() {
  const action = useApiAction(async ({ type, payload }) => {
    if (type === "list") return api.medicines.list();
    if (type === "byId") return api.medicines.byId(payload.id);
    if (type === "create") return api.medicines.create(payload);
    if (type === "stock") return api.medicines.updateStock(payload.id, { stockQuantity: Number(payload.stockQuantity) });
    return null;
  });

  const [medicineId, setMedicineId] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [createForm, setCreateForm] = useState({ name: "", stockQuantity: "0", unitPrice: "" });

  return (
    <Page title="Medicines" subtitle="/medicines/* APIs">
      <Grid>
        <Card title="List Medicines"><Button onClick={() => action.run({ type: "list" })}>Fetch</Button></Card>
        <Card title="Medicine By ID">
          <Field label="Medicine ID"><Input value={medicineId} onChange={(e) => setMedicineId(e.target.value)} /></Field>
          <Button onClick={() => action.run({ type: "byId", payload: { id: medicineId } })} disabled={!medicineId}>Fetch</Button>
        </Card>
      </Grid>

      <Grid>
        <Card title="Add Medicine (Admin)">
          <Field label="Name"><Input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} /></Field>
          <Field label="Stock Quantity"><Input type="number" value={createForm.stockQuantity} onChange={(e) => setCreateForm({ ...createForm, stockQuantity: e.target.value })} /></Field>
          <Field label="Unit Price"><Input type="number" step="0.01" value={createForm.unitPrice} onChange={(e) => setCreateForm({ ...createForm, unitPrice: e.target.value })} /></Field>
          <Button onClick={() => action.run({ type: "create", payload: { name: createForm.name, stockQuantity: Number(createForm.stockQuantity), unitPrice: Number(createForm.unitPrice) } })}>Create</Button>
        </Card>
        <Card title="Update Stock">
          <Field label="Medicine ID"><Input value={medicineId} onChange={(e) => setMedicineId(e.target.value)} /></Field>
          <Field label="Stock Quantity"><Input type="number" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} /></Field>
          <Button onClick={() => action.run({ type: "stock", payload: { id: medicineId, stockQuantity } })} disabled={!medicineId}>Update</Button>
        </Card>
      </Grid>

      <Card title="Response">{action.error ? <p className="text-sm text-rose-600">{action.error}</p> : <JsonPanel data={action.result} />}</Card>
    </Page>
  );
}
