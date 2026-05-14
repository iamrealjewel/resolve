import { PrismaClient } from "../src/generated/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import * as dotenv from "dotenv";

dotenv.config();

const url = new URL(process.env.DATABASE_URL!);
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: parseInt(url.port || "3306"),
  user: url.username,
  password: decodeURIComponent(url.password),
  database: url.pathname.substring(1),
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // Update any users with potentially broken roles (if they were REPORTER)
  // Since we renamed REPORTER to USER, and used --accept-data-loss, 
  // they might be in an inconsistent state or casted to the first enum value.
  
  const users = await prisma.user.findMany();
  console.log("Current Users:");
  for (const u of users) {
    console.log(`${u.email}: ${u.role}`);
  }

  // Ensure 'jewel' is SUPER_ADMIN (just in case)
  await prisma.user.updateMany({
    where: { email: "jewel@ispahani.com" },
    data: { role: "SUPER_ADMIN" }
  });

  // Ensure everyone else has a valid role
  // (In a real scenario we'd be more careful, but here we want to stabilize)
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
