import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding test users and profiles...\n");

  // ── Users + profiles ──────────────────────────────────────────────────────
  const userDefs = [
    { ldapId: "doctor01",    role: "DOCTOR" },
    { ldapId: "reception01", role: "RECEPTION_STAFF" },
    { ldapId: "patient01",   role: "PATIENT" },
    { ldapId: "pharmacy01",  role: "PHARMACY_STAFF" },
    { ldapId: "lab01",       role: "LAB_STAFF" },
    { ldapId: "admin01",     role: "ADMIN" },
  ];

  for (const def of userDefs) {
    const user = await prisma.user.upsert({
      where:  { ldapId: def.ldapId },
      update: {},
      create: { ldapId: def.ldapId, role: def.role, isActive: true },
    });

    switch (def.role) {
      case "DOCTOR":
        await prisma.doctor.upsert({
          where:  { userId: user.id },
          update: {},
          create: {
            userId:      user.id,
            name:        "Dr. Sharma",
            doctorType:  "PHYSICIAN",
            isAvailable: true,
          },
        });
        break;

      case "PATIENT":
        await prisma.patient.upsert({
          where:  { userId: user.id },
          update: {},
          create: {
            userId:     user.id,
            name:       "Rahul Verma",
            qrCode:     "QR001",
            bloodGroup: "B+",
            phone:      "9876543210",
          },
        });
        break;

      case "RECEPTION_STAFF":
        await prisma.receptionStaff.upsert({
          where:  { userId: user.id },
          update: {},
          create: { userId: user.id },
        });
        break;

      case "PHARMACY_STAFF":
        await prisma.pharmacyStaff.upsert({
          where:  { userId: user.id },
          update: {},
          create: { userId: user.id },
        });
        break;

      case "LAB_STAFF":
        await prisma.labStaff.upsert({
          where:  { userId: user.id },
          update: {},
          create: { userId: user.id },
        });
        break;
    }

    console.log(`  ✓ ${def.ldapId} (${def.role})`);
  }

  // ── Medicines ─────────────────────────────────────────────────────────────
  console.log("\nSeeding medicines...\n");

  const medicines = [
    { name: "Paracetamol 500mg", stockQuantity: 200, unitPrice: 2.50 },
    { name: "Amoxicillin 250mg", stockQuantity: 100, unitPrice: 8.00 },
  ];

  for (const med of medicines) {
    const existing = await prisma.medicine.findFirst({ where: { name: med.name } });
    if (!existing) {
      await prisma.medicine.create({ data: med });
      console.log(`  ✓ ${med.name} (created)`);
    } else {
      console.log(`  - ${med.name} (already exists, skipped)`);
    }
  }

  console.log("\nDone. Database is ready for testing.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
