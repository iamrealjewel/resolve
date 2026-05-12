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
  const appCat = await prisma.incidentCategory.findFirst({
    where: { name: "Application" }
  });
  
  if (!appCat) {
    console.log("Application category not found");
    return;
  }

  const rules = await prisma.routingRule.findMany({
    where: { categoryId: appCat.id },
    include: { department: true }
  });
  
  console.log("--- APPLICATION RULES ---");
  console.log(JSON.stringify(rules, null, 2));

  const remCat = await prisma.incidentCategory.findFirst({
    where: { name: "Remittance" }
  });
  if (remCat) {
    const rules2 = await prisma.routingRule.findMany({
      where: { categoryId: remCat.id },
      include: { department: true }
    });
    console.log("\n--- REMITTANCE RULES ---");
    console.log(JSON.stringify(rules2, null, 2));
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
