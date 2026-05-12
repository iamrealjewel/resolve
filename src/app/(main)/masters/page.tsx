import { prisma } from "@/lib/prisma";
import { MastersClient } from "./masters-client";

async function getMasterData() {
  const [categories, departments, locations, companies, rules, users, designations] = await Promise.all([
    prisma.incidentCategory.findMany({ 
      include: { 
        children: true, 
        parent: true, 
        approvers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                company: { select: { name: true } },
                department: { select: { name: true } },
                designation: { select: { title: true } }
              }
            }
          }
        } 
      } 
    }),
    prisma.department.findMany({ include: { children: true, parent: true } }),
    prisma.location.findMany(),
    prisma.company.findMany(),
    prisma.routingRule.findMany({ include: { category: true, department: true } }),
    prisma.user.findMany({ 
      select: { 
        id: true, 
        name: true, 
        role: true, 
        companyId: true,
        company: { select: { name: true } },
        department: { select: { name: true } },
        designation: { select: { title: true } }
      } 
    }),
    prisma.designation.findMany(),
  ]);
  return { categories, departments, locations, companies, rules, users, designations };
}

import { checkAuth } from "@/lib/auth-utils";

export default async function MastersPage() {
  await checkAuth("SUPER_ADMIN");
  const data = await getMasterData();
  return <MastersClient data={data} />;
}
