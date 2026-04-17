import "dotenv/config";
import { app } from "../src/app.js";
import prisma, { connectDB, disconnectDB } from "../src/db/index.js";

const ensureSeedData = async () => {
  const userDefs = [
    { ldapId: "doctor01", role: "DOCTOR" },
    { ldapId: "reception01", role: "RECEPTION_STAFF" },
    { ldapId: "patient01", role: "PATIENT" },
    { ldapId: "pharmacy01", role: "PHARMACY_STAFF" },
    { ldapId: "lab01", role: "LAB_STAFF" },
    { ldapId: "admin01", role: "ADMIN" },
  ];

  for (const def of userDefs) {
    const user = await prisma.user.upsert({
      where: { ldapId: def.ldapId },
      update: { isActive: true },
      create: { ldapId: def.ldapId, role: def.role, isActive: true },
    });

    if (def.role === "DOCTOR") {
      await prisma.doctor.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          name: "Dr. Sharma",
          doctorType: "PHYSICIAN",
          isAvailable: true,
        },
      });
    }

    if (def.role === "PATIENT") {
      await prisma.patient.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          name: "Rahul Verma",
          qrCode: "QR001",
          bloodGroup: "B+",
          phone: "9876543210",
        },
      });
    }

    if (def.role === "RECEPTION_STAFF") {
      await prisma.receptionStaff.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id },
      });
    }

    if (def.role === "PHARMACY_STAFF") {
      await prisma.pharmacyStaff.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id },
      });
    }

    if (def.role === "LAB_STAFF") {
      await prisma.labStaff.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id },
      });
    }
  }
};

const startServer = async () => {
  await connectDB();
  await ensureSeedData();

  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const address = server.address();
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${address.port}/api/v1`,
      });
    });
  });
};

const stopServer = async (server) => {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
  await disconnectDB();
};

const request = async (baseUrl, method, path, { token, body } = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => null);
  return { status: response.status, payload };
};

const login = async (baseUrl, ldapId) => {
  const passwordMap = {
    doctor01: "doctor01pass",
    reception01: "reception01pass",
    patient01: "patient01pass",
    pharmacy01: "pharmacy01pass",
    lab01: "lab01pass",
    admin01: "admin01pass",
  };

  const { status, payload } = await request(baseUrl, "POST", "/auth/login", {
    body: { ldapId, password: passwordMap[ldapId] },
  });

  if (status !== 200) {
    throw new Error(`Failed to log in as ${ldapId}: ${payload?.message || status}`);
  }

  return payload.data.token;
};

const expectStatus = async (label, promise, expectedStatus) => {
  const response = await promise;

  if (response.status !== expectedStatus) {
    throw new Error(
      `${label} -> expected ${expectedStatus}, got ${response.status}: ${
        response.payload?.message || "Unknown error"
      }`
    );
  }
};

const main = async () => {
  const { server, baseUrl } = await startServer();

  try {
    const patientToken = await login(baseUrl, "patient01");
    const doctorToken = await login(baseUrl, "doctor01");
    const receptionToken = await login(baseUrl, "reception01");
    const pharmacyToken = await login(baseUrl, "pharmacy01");
    const labToken = await login(baseUrl, "lab01");
    const adminToken = await login(baseUrl, "admin01");

    const patientProfile = await request(baseUrl, "GET", "/patients/me", {
      token: patientToken,
    });
    const doctorProfile = await request(baseUrl, "GET", "/auth/me", {
      token: doctorToken,
    });
    const patientId = patientProfile.payload.data.id;
    const doctorId = doctorProfile.payload.data.doctor.id;

    await expectStatus(
      "Patient cannot access pharmacy prescription queue",
      request(baseUrl, "GET", "/prescriptions/pending", { token: patientToken }),
      403
    );
    await expectStatus(
      "Doctor cannot access admin user list",
      request(baseUrl, "GET", "/admin/users", { token: doctorToken }),
      403
    );
    await expectStatus(
      "Reception cannot pay a bill directly",
      request(baseUrl, "PUT", "/bills/non-existent-id/pay", { token: receptionToken }),
      403
    );
    await expectStatus(
      "Pharmacy cannot create visits",
      request(baseUrl, "POST", "/visits", {
        token: pharmacyToken,
        body: { patientId, doctorId, visitType: "OPD" },
      }),
      403
    );
    await expectStatus(
      "Lab staff cannot create appointments",
      request(baseUrl, "POST", "/appointments", {
        token: labToken,
        body: {
          doctorId,
          appointmentTime: "2026-12-01T10:00:00.000Z",
          slotDuration: 15,
        },
      }),
      403
    );
    await expectStatus(
      "Admin can access attendance report",
      request(baseUrl, "GET", "/admin/reports/attendance", { token: adminToken }),
      200
    );

    console.log("RBAC smoke checks passed.");
  } finally {
    await stopServer(server);
  }
};

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
