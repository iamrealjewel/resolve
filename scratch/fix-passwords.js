const { PrismaClient } = require("../src/generated/client");
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
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { password: "" },
        { password: { contains: " " } } // Just in case
      ]
    }
  });

  console.log(`Found ${users.length} users with empty passwords.`);
  const hashedPassword = await bcrypt.hash("password123", 10);

  for (const u of users) {
    console.log(`Updating password for: ${u.email}`);
    await prisma.user.update({
      where: { id: u.id },
      data: { password: hashedPassword }
    });
  }

  // Also ensure Rasul's password is set specifically if it was empty
  const rasul = await prisma.user.findUnique({ where: { email: "riyad.amin@ispahanibd.com" } });
  if (rasul && (!rasul.password || rasul.password.length === 0)) {
     console.log("Setting Rasul's password to 'password123'");
     await prisma.user.update({
       where: { id: rasul.id },
       data: { password: hashedPassword }
     });
  }

  console.log("All empty passwords have been set to 'password123' (hashed).");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
