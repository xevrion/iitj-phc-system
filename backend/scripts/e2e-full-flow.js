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

  const medicines = [
    { name: "Paracetamol 500mg", stockQuantity: 200, unitPrice: 2.5 },
    { name: "Amoxicillin 250mg", stockQuantity: 100, unitPrice: 8.0 },
  ];

  for (const medicine of medicines) {
    const existing = await prisma.medicine.findFirst({
      where: { name: medicine.name },
    });

    if (!existing) {
      await prisma.medicine.create({ data: medicine });
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

const request = async (baseUrl, method, path, { token, body, expectedStatus } = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => null);

  if (expectedStatus && response.status !== expectedStatus) {
    const message = payload?.message || response.statusText;
    throw new Error(`${method} ${path} -> expected ${expectedStatus}, got ${response.status}: ${message}`);
  }

  return { status: response.status, payload };
};

const login = async (baseUrl, ldapId) => {
  const { payload } = await request(baseUrl, "POST", "/auth/login", {
    body: { ldapId, password: "anything" },
    expectedStatus: 200,
  });
  return payload.data.token;
};

const ensureDoctorReady = async (baseUrl, token) => {
  await request(baseUrl, "POST", "/doctors/me/checkout", {
    token,
  });

  await request(baseUrl, "PUT", "/doctors/me/availability", {
    token,
    body: { isAvailable: true },
    expectedStatus: 200,
  });

  await request(baseUrl, "POST", "/doctors/me/checkin", {
    token,
    expectedStatus: 200,
  });
};

const main = async () => {
  const { server, baseUrl } = await startServer();

  try {
    const receptionToken = await login(baseUrl, "reception01");
    const doctorToken = await login(baseUrl, "doctor01");
    const pharmacyToken = await login(baseUrl, "pharmacy01");
    const labToken = await login(baseUrl, "lab01");
    const patientToken = await login(baseUrl, "patient01");

    await ensureDoctorReady(baseUrl, doctorToken);

    const patientRes = await request(baseUrl, "GET", "/patients/qr/QR001", {
      token: receptionToken,
      expectedStatus: 200,
    });
    const patientId = patientRes.payload.data.id;

    const medicineRes = await request(baseUrl, "GET", "/medicines", {
      token: doctorToken,
      expectedStatus: 200,
    });
    const paracetamol = medicineRes.payload.data.find((item) =>
      item.name.includes("Paracetamol")
    );
    if (!paracetamol) {
      throw new Error("Seeded Paracetamol medicine not found");
    }

    const visitRes = await request(baseUrl, "POST", "/checkin", {
      token: receptionToken,
      body: {
        qrCode: "QR001",
        visitType: "OPD",
        vitals: {
          weight: 67.2,
          temperature: 98.7,
          bloodPressure: "118/76",
        },
      },
      expectedStatus: 201,
    });
    const visitId = visitRes.payload.data.id;

    await request(baseUrl, "PUT", `/visits/${visitId}/claim`, {
      token: doctorToken,
      expectedStatus: 200,
    });

    await request(baseUrl, "PUT", `/visits/${visitId}/consultation`, {
      token: doctorToken,
      body: {
        consultationNotes: "Mild fever and headache. E2E validation flow.",
      },
      expectedStatus: 200,
    });

    const prescriptionRes = await request(
      baseUrl,
      "POST",
      `/visits/${visitId}/prescription`,
      {
        token: doctorToken,
        body: {
          notes: "Take after food",
          items: [
            {
              medicineId: paracetamol.id,
              dosage: "500mg",
              duration: "3 days",
            },
          ],
        },
        expectedStatus: 201,
      }
    );
    const prescriptionId = prescriptionRes.payload.data.id;

    const labRequestRes = await request(
      baseUrl,
      "POST",
      `/visits/${visitId}/lab-requests`,
      {
        token: doctorToken,
        body: { testName: "CBC - Complete Blood Count" },
        expectedStatus: 201,
      }
    );
    const labRequestId = labRequestRes.payload.data.id;

    await request(baseUrl, "PUT", `/visits/${visitId}/complete`, {
      token: doctorToken,
      expectedStatus: 200,
    });

    await request(baseUrl, "PUT", `/prescriptions/${prescriptionId}/dispense`, {
      token: pharmacyToken,
      expectedStatus: 200,
    });

    const billRes = await request(baseUrl, "POST", `/visits/${visitId}/bill`, {
      token: pharmacyToken,
      body: {
        items: [
          {
            medicineId: paracetamol.id,
            quantity: 2,
          },
        ],
      },
      expectedStatus: 201,
    });
    const billId = billRes.payload.data.id;

    await request(baseUrl, "PUT", `/bills/${billId}/pay`, {
      token: pharmacyToken,
      expectedStatus: 200,
    });

    await request(baseUrl, "POST", `/lab-requests/${labRequestId}/report`, {
      token: labToken,
      body: {
        reportUrl: "https://storage.example.com/reports/e2e-cbc.pdf",
      },
      expectedStatus: 201,
    });

    const completedLabRes = await request(baseUrl, "GET", `/lab-requests/${labRequestId}`, {
      token: patientToken,
      expectedStatus: 200,
    });

    const finalBillRes = await request(baseUrl, "GET", `/visits/${visitId}/bill`, {
      token: pharmacyToken,
      expectedStatus: 200,
    });

    await request(baseUrl, "POST", "/doctors/me/checkout", {
      token: doctorToken,
      expectedStatus: 200,
    });

    console.log("E2E flow passed.");
    console.log(
      JSON.stringify(
        {
          patientId,
          visitId,
          prescriptionId,
          labRequestId,
          billId,
          billStatus: finalBillRes.payload.data.paymentStatus,
          labStatus: completedLabRes.payload.data.status,
        },
        null,
        2
      )
    );
  } finally {
    await stopServer(server);
  }
};

main().catch((error) => {
  console.error("E2E flow failed:", error.message);
  process.exitCode = 1;
});
