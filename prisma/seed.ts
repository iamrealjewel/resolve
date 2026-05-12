require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");
const mariadb = require("mariadb");
const bcrypt = require("bcryptjs");

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
  const hashedPassword = await bcrypt.hash("admin123", 10);

  // 1. Create Company
  const company = await prisma.company.upsert({
    where: { id: "cl-group-1" },
    update: {},
    create: {
      id: "cl-group-1",
      name: "Ispahani Group",
    },
  });

  // 2. Create Location
  const location = await prisma.location.create({
    data: {
      name: "Headquarters (HQ)",
      companyId: company.id,
    },
  });

  // 3. Create Departments
  const itDept = await prisma.department.create({
    data: {
      name: "IT",
      companyId: company.id,
    },
  });

  await prisma.department.create({
    data: {
      name: "Accounts",
      companyId: company.id,
    },
  });

  // 4. Create Incident Categories
  const itCategory = await prisma.incidentCategory.create({
    data: {
      name: "IT",
    },
  });

  await prisma.incidentCategory.create({
    data: {
      name: "Application",
      parentId: itCategory.id,
    },
  });
  
  await prisma.incidentCategory.create({
    data: {
      name: "Network",
      parentId: itCategory.id,
    },
  });

  await prisma.incidentCategory.create({
    data: {
      name: "System",
      parentId: itCategory.id,
    },
  });

  const accountsCategory = await prisma.incidentCategory.create({
    data: {
      name: "Accounts",
    },
  });

  await prisma.incidentCategory.create({
    data: {
      name: "Accounts Payable",
      parentId: accountsCategory.id,
    },
  });

  // 5. Create Super Admin User
  await prisma.user.upsert({
    where: { email: "jahirul.islam@ispahanibd.com" },
    update: {},
    create: {
      email: "jahirul.islam@ispahanibd.com",
      name: "Jahirul Islam",
      password: hashedPassword,
      role: "SUPER_ADMIN",
      companyId: company.id,
      departmentId: itDept.id,
      locationId: location.id,
    },
  });

  console.log("Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
