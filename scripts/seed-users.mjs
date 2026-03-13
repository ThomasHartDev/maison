/**
 * Seed the users table with the 5 initial users.
 * Run: node scripts/seed-users.mjs
 */

import { neon } from "@neondatabase/serverless";
import { randomUUID } from "crypto";
import bcryptjs from "bcryptjs";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL is required");

const sql = neon(DATABASE_URL);

const USERS = [
  { email: "admin@maison.com", password: "pass", name: "Juliette Martin", role: "admin" },
  { email: "logistics@maison.com", password: "pass", name: "Sophie Laurent", role: "logistics" },
  { email: "marketing@maison.com", password: "pass", name: "Claire Dubois", role: "marketing" },
  { email: "design@maison.com", password: "pass", name: "Isabelle Moreau", role: "design" },
  { email: "warehouse@maison.com", password: "pass", name: "Luc Renaud", role: "warehouse" },
];

async function main() {
  // Create users table if it doesn't exist
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      "passwordHash" TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'logistics',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
    )
  `;

  // Create audit_log table if it doesn't exist
  await sql`
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      "purchaseOrderId" TEXT NOT NULL,
      "userId" TEXT,
      "userName" TEXT NOT NULL,
      action TEXT NOT NULL,
      field TEXT,
      "oldValue" TEXT,
      "newValue" TEXT,
      source TEXT NOT NULL DEFAULT 'manual',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
    )
  `;

  console.log("Tables created/verified.\n");

  for (const u of USERS) {
    const id = randomUUID();
    const passwordHash = await bcryptjs.hash(u.password, 12);

    await sql`
      INSERT INTO users (id, email, "passwordHash", name, role)
      VALUES (${id}, ${u.email}, ${passwordHash}, ${u.name}, ${u.role})
      ON CONFLICT (email) DO UPDATE SET
        "passwordHash" = EXCLUDED."passwordHash",
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        "updatedAt" = NOW()
    `;
    console.log(`  Seeded: ${u.email} (${u.role})`);
  }

  const result = await sql`SELECT COUNT(*) as count FROM users`;
  console.log(`\nDone. ${result[0].count} users in database.`);
}

main().catch(e => {
  console.error("Seed failed:", e.message);
  process.exit(1);
});
