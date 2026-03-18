import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, Field, Input, Notice } from "../components/Ui";

export default function LoginPage() {
  const { token, login } = useAuth();
  const [ldapId, setLdapId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (token) return <Navigate to="/" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(ldapId, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg"
      >
        <h1 className="text-3xl font-bold text-slate-800">IITJ PHC Portal</h1>
        <p className="mb-5 mt-1 text-sm text-slate-500">Sign in with your LDAP identity.</p>

        <div className="space-y-3">
          <Field label="LDAP ID">
            <Input value={ldapId} onChange={(e) => setLdapId(e.target.value)} required />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          {error && <Notice kind="error">{error}</Notice>}
          <Button disabled={loading} className="w-full" type="submit">
            {loading ? "Signing in..." : "Login"}
          </Button>
        </div>
      </form>
    </div>
  );
}
