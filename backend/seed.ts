/**
 * Seed script — creates one account per role with known credentials.
 * Run with: npm run seed
 *
 * Credentials printed to console after seeding.
 */

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import User from "./src/models/user.model";

const SEED_USERS = [
  { email: "admin@creditsea.com",       password: "Admin@123",       role: "admin" },
  { email: "sales@creditsea.com",        password: "Sales@123",       role: "sales" },
  { email: "sanction@creditsea.com",     password: "Sanction@123",    role: "sanction" },
  { email: "disburse@creditsea.com",     password: "Disburse@123",    role: "disbursement" },
  { email: "collection@creditsea.com",   password: "Collect@123",     role: "collection" },
  { email: "borrower@creditsea.com",     password: "Borrower@123",    role: "borrower" },
] as const;

async function seed() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI not set in .env");

  await mongoose.connect(uri);
  console.log("✅ Connected to MongoDB\n");

  for (const userData of SEED_USERS) {
    const existing = await User.findOne({ email: userData.email });
    if (existing) {
      console.log(`⏭️  Skipped (already exists): ${userData.email}`);
      continue;
    }

    await User.create(userData);
    console.log(`✅ Created [${userData.role.padEnd(12)}] ${userData.email}`);
  }

  console.log("\n─────────────────────────────────────────────────");
  console.log("SEEDED CREDENTIALS (for evaluator)");
  console.log("─────────────────────────────────────────────────");
  for (const u of SEED_USERS) {
    console.log(`[${u.role.padEnd(12)}]  ${u.email.padEnd(30)} ${u.password}`);
  }
  console.log("─────────────────────────────────────────────────\n");

  await mongoose.disconnect();
  console.log("Done. Database connection closed.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});