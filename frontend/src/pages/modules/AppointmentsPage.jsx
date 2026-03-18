import { useState } from "react";
import { api } from "../../api/endpoints";
import { useApiAction } from "../../hooks/useApiAction";
import { Button, Card, Field, Grid, Input, JsonPanel, Page, Select } from "../../components/Ui";

export default function AppointmentsPage() {
  const action = useApiAction(async ({ type, payload }) => {
    if (type === "book") return api.appointments.book(payload);
    if (type === "my") return api.appointments.my();
    if (type === "cancel") return api.appointments.cancel(payload.id);
    return null;
  });

  const [book, setBook] = useState({
    doctorId: "",
    appointmentTime: "",
    slotDuration: "15",
    isEmergency: "false",
    patientId: "",
  });
  const [appointmentId, setAppointmentId] = useState("");

  return (
    <Page title="Appointments" subtitle="/appointments/* APIs">
      <Grid>
        <Card title="Book Appointment">
          <Field label="Doctor ID"><Input value={book.doctorId} onChange={(e) => setBook({ ...book, doctorId: e.target.value })} /></Field>
          <Field label="Appointment Time (ISO)"><Input value={book.appointmentTime} onChange={(e) => setBook({ ...book, appointmentTime: e.target.value })} /></Field>
          <Field label="Slot Duration (minutes)"><Input type="number" value={book.slotDuration} onChange={(e) => setBook({ ...book, slotDuration: e.target.value })} /></Field>
          <Field label="Emergency"><Select value={book.isEmergency} onChange={(e) => setBook({ ...book, isEmergency: e.target.value })}><option value="false">false</option><option value="true">true</option></Select></Field>
          <Field label="Patient ID (required for RECEPTION_STAFF)"><Input value={book.patientId} onChange={(e) => setBook({ ...book, patientId: e.target.value })} /></Field>
          <Button
            onClick={() =>
              action.run({
                type: "book",
                payload: {
                  doctorId: book.doctorId,
                  appointmentTime: book.appointmentTime,
                  slotDuration: Number(book.slotDuration),
                  isEmergency: book.isEmergency === "true",
                  ...(book.patientId ? { patientId: book.patientId } : {}),
                },
              })
            }
          >
            Submit
          </Button>
        </Card>
        <Card title="My Appointments"><Button onClick={() => action.run({ type: "my" })}>Fetch</Button></Card>
      </Grid>

      <Card title="Cancel Appointment">
        <Field label="Appointment ID"><Input value={appointmentId} onChange={(e) => setAppointmentId(e.target.value)} /></Field>
        <Button variant="danger" onClick={() => action.run({ type: "cancel", payload: { id: appointmentId } })} disabled={!appointmentId}>Cancel</Button>
      </Card>

      <Card title="Response">
        {action.error ? <p className="text-sm text-rose-600">{action.error}</p> : <JsonPanel data={action.result} />}
      </Card>
    </Page>
  );
}
