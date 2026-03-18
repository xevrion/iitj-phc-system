import { useState } from "react";
import { api } from "../../api/endpoints";
import { useApiAction } from "../../hooks/useApiAction";
import { Button, Card, Field, Grid, Input, JsonPanel, Page, Select } from "../../components/Ui";

export default function DoctorsPage() {
  const action = useApiAction(async ({ type, payload }) => {
    switch (type) {
      case "list":
        return api.doctors.list();
      case "byId":
        return api.doctors.byId(payload.id);
      case "availability":
        return api.doctors.updateAvailability(payload.isAvailable);
      case "checkin":
        return api.doctors.checkin();
      case "checkout":
        return api.doctors.checkout();
      case "myAppointments":
        return api.doctors.myAppointments();
      case "attendance":
        return api.doctors.attendance(payload.doctorId || undefined);
      case "appointmentsByDoctor":
        return api.doctors.appointmentsByDoctor(payload.id);
      default:
        return null;
    }
  });

  const [id, setId] = useState("");
  const [attendanceDoctorId, setAttendanceDoctorId] = useState("");
  const [isAvailable, setIsAvailable] = useState("true");

  return (
    <Page title="Doctors" subtitle="/doctors/* APIs">
      <Grid>
        <Card title="List Available Doctors"><Button onClick={() => action.run({ type: "list" })}>Fetch</Button></Card>
        <Card title="Doctor Profile">
          <Field label="Doctor ID"><Input value={id} onChange={(e) => setId(e.target.value)} /></Field>
          <Button onClick={() => action.run({ type: "byId", payload: { id } })} disabled={!id}>Fetch</Button>
        </Card>
      </Grid>

      <Grid>
        <Card title="Update My Availability">
          <Field label="isAvailable">
            <Select value={isAvailable} onChange={(e) => setIsAvailable(e.target.value)}>
              <option value="true">true</option>
              <option value="false">false</option>
            </Select>
          </Field>
          <Button onClick={() => action.run({ type: "availability", payload: { isAvailable: isAvailable === "true" } })}>Update</Button>
        </Card>
        <Card title="Attendance Actions">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => action.run({ type: "checkin" })}>Check In</Button>
            <Button variant="secondary" onClick={() => action.run({ type: "checkout" })}>Check Out</Button>
          </div>
        </Card>
      </Grid>

      <Grid>
        <Card title="My Appointments"><Button onClick={() => action.run({ type: "myAppointments" })}>Fetch</Button></Card>
        <Card title="Appointments By Doctor ID">
          <Field label="Doctor ID"><Input value={id} onChange={(e) => setId(e.target.value)} /></Field>
          <Button onClick={() => action.run({ type: "appointmentsByDoctor", payload: { id } })} disabled={!id}>Fetch</Button>
        </Card>
      </Grid>

      <Card title="Attendance Records (Admin)">
        <Field label="doctorId (optional)"><Input value={attendanceDoctorId} onChange={(e) => setAttendanceDoctorId(e.target.value)} /></Field>
        <Button onClick={() => action.run({ type: "attendance", payload: { doctorId: attendanceDoctorId } })}>Fetch Records</Button>
      </Card>

      <Card title="Response">
        {action.error ? <p className="text-sm text-rose-600">{action.error}</p> : <JsonPanel data={action.result} />}
      </Card>
    </Page>
  );
}
