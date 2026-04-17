import "dotenv/config";

const BASE_URL = process.env.LOAD_TEST_BASE_URL || "http://localhost:8000/api/v1";
const CONCURRENCY = Number(process.env.LOAD_TEST_CONCURRENCY || 20);
const ITERATIONS = Number(process.env.LOAD_TEST_ITERATIONS || 5);

const requestJson = async (method, path, { body, token } = {}) => {
  const startedAt = performance.now();
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  await response.text();

  return {
    status: response.status,
    durationMs: performance.now() - startedAt,
  };
};

const percentile = (values, p) => {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
};

const login = async (ldapId, password) => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ldapId, password }),
  });

  const payload = await response.json().catch(() => null);

  if (response.status !== 200) {
    throw new Error(`Login failed for ${ldapId}: ${payload?.message || response.statusText}`);
  }

  return payload.data.token;
};

const main = async () => {
  const patientToken = await login("patient01", "patient01pass");
  const doctors = [];

  for (let iteration = 0; iteration < ITERATIONS; iteration += 1) {
    const batch = await Promise.all(
      Array.from({ length: CONCURRENCY }, async (_, index) => {
        const requestType = index % 3;

        if (requestType === 0) {
          return requestJson("GET", "/healthcheck");
        }

        if (requestType === 1) {
          return requestJson("GET", "/auth/me", { token: patientToken });
        }

        return requestJson("GET", "/events");
      })
    );

    doctors.push(...batch);
  }

  const failures = doctors.filter((result) => result.status >= 400);
  const durations = doctors.map((result) => result.durationMs);
  const averageMs =
    durations.reduce((sum, duration) => sum + duration, 0) / (durations.length || 1);

  const summary = {
    baseUrl: BASE_URL,
    requests: doctors.length,
    concurrency: CONCURRENCY,
    iterations: ITERATIONS,
    failures: failures.length,
    averageMs: Number(averageMs.toFixed(2)),
    p95Ms: Number(percentile(durations, 95).toFixed(2)),
    maxMs: Number(Math.max(...durations, 0).toFixed(2)),
  };

  if (failures.length > 0) {
    console.error("Load check failed.");
    console.error(JSON.stringify(summary, null, 2));
    process.exit(1);
  }

  console.log("Load check completed.");
  console.log(JSON.stringify(summary, null, 2));
};

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
