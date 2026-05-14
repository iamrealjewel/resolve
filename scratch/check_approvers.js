const { PrismaClient } = require("../src/generated/client");
const prisma = new PrismaClient();

async function check() {
  const categories = await prisma.incidentCategory.findMany({
    include: {
      approvers: {
        include: {
          user: {
            include: {
              company: true,
              department: true,
              designation: true
            }
          }
        }
      }
    }
  });

  console.log("Categories with approvers:");
  categories.forEach(c => {
    if (c.approvers.length > 0) {
      console.log(`Category: ${c.name}`);
      c.approvers.forEach(a => {
        console.log(`  - ${a.type}: ${a.user.name} (${a.user.designation?.title || "No Title"})`);
      });
    }
  });
}

check();
