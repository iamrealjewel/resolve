const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
dotenv.config();

const url = new URL(process.env.DATABASE_URL);
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: parseInt(url.port || "3306"),
  user: url.username,
  password: decodeURIComponent(url.password),
  database: url.pathname.substring(1),
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany();
  console.log(`Updating ${users.length} users...`);
  
  const hashedPassword = await bcrypt.hash("password123", 10);

  for (const u of users) {
    console.log(`Setting password for: ${u.email}`);
    await prisma.user.update({
      where: { id: u.id },
      data: { password: hashedPassword }
    });
  }

  console.log("All user passwords have been set to 'password123' (hashed).");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
