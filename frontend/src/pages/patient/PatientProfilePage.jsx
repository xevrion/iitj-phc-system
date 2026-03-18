import { useState } from "react";
import { api } from "../../api/endpoints";
import { Button, Card, Field, Grid, Input, Notice, Page } from "../../components/Ui";
import { usePatientProfile } from "../../hooks/usePatientProfile";

export default function PatientProfilePage() {
  const { profile, loading, error, refresh } = usePatientProfile();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    dob: "",
    email: "",
    bloodGroup: "",
    phone: "",
    address: "",
  });

  const hydrateForm = () => {
    if (!profile) return;
    setForm({
      name: profile.name || "",
      dob: profile.dob ? String(profile.dob).slice(0, 10) : "",
      email: profile.email || "",
      bloodGroup: profile.bloodGroup || "",
      phone: profile.phone || "",
      address: profile.address || "",
    });
  };

  const onSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await api.patients.updateMyProfile(form);
      await refresh();
      setMessage("Profile updated successfully.");
    } catch (err) {
      setMessage(err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page title="My Profile" subtitle="Keep personal and medical identity details up to date.">
      <Card title="Current Profile" right={<Button variant="secondary" onClick={hydrateForm}>Use Current Values</Button>}>
        {loading ? (
          <p className="text-sm text-slate-500">Loading profile...</p>
        ) : error ? (
          <Notice kind="error">{error}</Notice>
        ) : (
          <div className="grid gap-1 text-sm text-slate-700">
            <div><strong>LDAP:</strong> {profile?.user?.ldapId || "-"}</div>
            <div><strong>QR Code:</strong> {profile?.qrCode || "-"}</div>
            <div><strong>Email:</strong> {profile?.email || "-"}</div>
            <div><strong>Phone:</strong> {profile?.phone || "-"}</div>
          </div>
        )}
      </Card>

      <Card title="Edit Profile">
        <Grid>
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Date of Birth"><Input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} /></Field>
          <Field label="Email"><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Blood Group"><Input value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Address"><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
        </Grid>
        {message ? <Notice kind={message.includes("success") ? "success" : "error"}>{message}</Notice> : null}
        <Button onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
      </Card>
    </Page>
  );
}
