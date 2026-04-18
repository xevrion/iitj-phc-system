import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const demoUsers = [
  {
    ldapId: "doctor01",
    role: "DOCTOR",
    profile: {
      name: "Dr. Sharma",
      doctorType: "PHYSICIAN",
      specialization: "General Medicine",
      isAvailable: false,
    },
  },
  {
    ldapId: "reception01",
    role: "RECEPTION_STAFF",
  },
  {
    ldapId: "patient01",
    role: "PATIENT",
    profile: {
      name: "Rahul Verma",
      qrCode: "QR001",
      bloodGroup: "B+",
      phone: "9876543210",
      email: "rahul.verma@example.com",
      address: "IIT Jodhpur Campus",
    },
  },
  {
    ldapId: "pharmacy01",
    role: "PHARMACY_STAFF",
  },
  {
    ldapId: "lab01",
    role: "LAB_STAFF",
  },
  {
    ldapId: "admin01",
    role: "ADMIN",
  },
];

const demoMedicines = [
  { name: "Paracetamol 500mg", stockQuantity: 250, unitPrice: 2.5 },
  { name: "Amoxicillin 250mg", stockQuantity: 120, unitPrice: 8.0 },
  { name: "Cetirizine 10mg", stockQuantity: 150, unitPrice: 3.0 },
  { name: "Pantoprazole 40mg", stockQuantity: 100, unitPrice: 6.5 },
];

async function clearDemoData() {
  console.log("Clearing existing application data...\n");

  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.pHCEvent.deleteMany(),
    prisma.doctorAttendance.deleteMany(),
    prisma.labReport.deleteMany(),
    prisma.labRequest.deleteMany(),
    prisma.billItem.deleteMany(),
    prisma.bill.deleteMany(),
    prisma.prescriptionItem.deleteMany(),
    prisma.prescription.deleteMany(),
    prisma.externalDocument.deleteMany(),
    prisma.visitVitals.deleteMany(),
    prisma.appointment.deleteMany(),
    prisma.visit.deleteMany(),
    prisma.receptionStaff.deleteMany(),
    prisma.pharmacyStaff.deleteMany(),
    prisma.labStaff.deleteMany(),
    prisma.doctor.deleteMany(),
    prisma.patient.deleteMany(),
    prisma.user.deleteMany(),
    prisma.medicine.deleteMany(),
  ]);

  console.log("  ✓ Existing visits, appointments, bills, reports, users, and medicines removed");
}

async function createDemoUsers() {
  console.log("\nCreating clean demo users and role profiles...\n");

  for (const entry of demoUsers) {
    const user = await prisma.user.create({
      data: {
        ldapId: entry.ldapId,
        role: entry.role,
        isActive: true,
      },
    });

    if (entry.role === "DOCTOR") {
      await prisma.doctor.create({
        data: {
          userId: user.id,
          ...entry.profile,
        },
      });
    }

    if (entry.role === "PATIENT") {
      await prisma.patient.create({
        data: {
          userId: user.id,
          ...entry.profile,
        },
      });
    }

    if (entry.role === "RECEPTION_STAFF") {
      await prisma.receptionStaff.create({
        data: { userId: user.id },
      });
    }

    if (entry.role === "PHARMACY_STAFF") {
      await prisma.pharmacyStaff.create({
        data: { userId: user.id },
      });
    }

    if (entry.role === "LAB_STAFF") {
      await prisma.labStaff.create({
        data: { userId: user.id },
      });
    }

    console.log(`  ✓ ${entry.ldapId} (${entry.role})`);
  }
}

async function createDemoMedicines() {
  console.log("\nCreating demo medicine inventory...\n");

  for (const medicine of demoMedicines) {
    await prisma.medicine.create({ data: medicine });
    console.log(
      `  ✓ ${medicine.name} | stock ${medicine.stockQuantity} | Rs. ${medicine.unitPrice.toFixed(2)}`
    );
  }
}

async function main() {
  await clearDemoData();
  await createDemoUsers();
  await createDemoMedicines();

  console.log("\nDemo seed complete.");
  console.log("Database is now clean for presentation:");
  console.log("  - no pending visits");
  console.log("  - no appointments");
  console.log("  - no prescriptions, bills, or lab requests");
  console.log("  - baseline role accounts recreated");
  console.log("  - medicine inventory reset");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
