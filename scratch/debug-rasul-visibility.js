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

async function getResolverCategoryIds(departmentId) {
  if (!departmentId) return [];
  const rules = await prisma.routingRule.findMany({
    where: { departmentId },
    select: { categoryId: true }
  });
  const rootCategoryIds = rules.map(r => r.categoryId);
  if (rootCategoryIds.length === 0) return [];
  const allCategories = await prisma.incidentCategory.findMany({
    select: { id: true, parentId: true }
  });
  const descendantIds = new Set();
  const findDescendants = (parentId) => {
    descendantIds.add(parentId);
    allCategories.filter(c => c.parentId === parentId).forEach(c => findDescendants(c.id));
  };
  rootCategoryIds.forEach(id => findDescendants(id));
  return Array.from(descendantIds);
}

async function debugRasulVisibility() {
  const user = await prisma.user.findFirst({
    where: { name: { contains: "Rasul Amin Riyad" } },
    include: { department: true }
  });

  if (!user) {
    console.log("Rasul Amin Riyad not found!");
    return;
  }

  console.log("--- DEBUGGING FOR USER ---");
  console.log(`User: ${user.name} (Role: ${user.role}, Dept: ${user.department?.name}, ID: ${user.id})`);
  console.log(`Company ID: ${user.companyId}`);

  // Simulate getIncidents("all") logic
  const resolverCatIds = await getResolverCategoryIds(user.departmentId);
  console.log(`Resolver Category IDs for Dept ${user.department?.name}:`, resolverCatIds);

  const where = {};
  // Global filter check (if any)
  // (We removed the global company filter for managers/resolvers)
  
  if (user.role === "DEPARTMENT_HEAD" || user.role === "LINE_MANAGER") {
      where.OR = [
        { departmentId: user.departmentId },
        { categoryId: { in: resolverCatIds } },
        { reporter: { superiorId: user.id } },
        { accessList: { some: { id: user.id } } }
      ];
  }

  console.log("\n--- EXECUTING QUERY ---");
  console.log("Prisma Where Clause:", JSON.stringify(where, null, 2));

  const incidents = await prisma.incident.findMany({
    where,
    include: {
        category: true,
        company: true
    }
  });

  console.log(`\nFound ${incidents.length} incidents.`);
  incidents.forEach(inc => {
      console.log(`- [${inc.ticketId}] ${inc.title} (Status: ${inc.status}, Company: ${inc.company.name})`);
  });

  if (incidents.length === 0) {
      console.log("\n--- ANALYZING WHY NO INCIDENTS FOUND ---");
      const allIncidents = await prisma.incident.findMany({
          take: 10,
          include: { category: true, company: true }
      });
      console.log(`Sample of all incidents (${allIncidents.length}):`);
      for (const inc of allIncidents) {
          console.log(`\nChecking incident ${inc.ticketId}:`);
          console.log(`  Title: ${inc.title}`);
          console.log(`  Dept ID: ${inc.departmentId} vs User Dept ID: ${user.departmentId}`);
          console.log(`  Category ID: ${inc.categoryId} (Parent: ${inc.category.parentId})`);
          console.log(`  Is in resolverCatIds? ${resolverCatIds.includes(inc.categoryId)}`);
          
          const reporter = await prisma.user.findUnique({ where: { id: inc.reporterId } });
          console.log(`  Reporter Superior ID: ${reporter?.superiorId} vs User ID: ${user.id}`);
          
          const inAccessList = await prisma.incident.findFirst({
              where: { id: inc.id, accessList: { some: { id: user.id } } }
          });
          console.log(`  Is in Access List? ${!!inAccessList}`);
      }
  }
}

debugRasulVisibility()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
