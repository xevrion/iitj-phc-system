import { useState } from "react";

export function useApiAction(fn) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async (payload) => {
    setLoading(true);
    setError("");
    try {
      const data = await fn(payload);
      setResult(data);
      return data;
    } catch (err) {
      const message = err?.message || "Request failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { result, setResult, loading, error, run };
}
