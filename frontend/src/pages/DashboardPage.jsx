import { useEffect, useState } from "react";
import { api } from "../api/endpoints";
import { Card, Page, JsonPanel, Notice } from "../components/Ui";

export default function DashboardPage() {
  const [health, setHealth] = useState(null);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [healthRes, meRes] = await Promise.all([api.healthcheck(), api.auth.me()]);
        setHealth(healthRes);
        setMe(meRes);
      } catch (err) {
        setError(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Page
      title="Operations Dashboard"
      subtitle="Backend-driven admin console mapped to all discovered API endpoints."
    >
      {error ? <Notice kind="error">{error}</Notice> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="API Health">
          {loading ? <p>Loading...</p> : <JsonPanel data={health} />}
        </Card>
        <Card title="Current User (/auth/me)">
          {loading ? <p>Loading...</p> : <JsonPanel data={me} />}
        </Card>
      </div>
      <Notice>
        Every module page includes fetch and mutate forms for GET/POST/PUT endpoints, with loading and error handling.
      </Notice>
    </Page>
  );
}
