const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");
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
  const user = await prisma.user.findUnique({
    where: { email: "riyad.amin@ispahanibd.com" }
  });
  if (user) {
    console.log(`Email: ${user.email}`);
    console.log(`Password: '${user.password}' (Length: ${user.password.length})`);
  } else {
    console.log("User not found");
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
