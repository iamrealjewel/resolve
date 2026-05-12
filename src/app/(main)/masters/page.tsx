import { prisma } from "@/lib/prisma";
import { MastersClient } from "./masters-client";

async function getMasterData() {
  console.log("Prisma keys at runtime:", Object.keys(prisma).filter(k => !k.startsWith("_")));
  const [categories, departments, locations, companies, rules, users, designations, templates] = await Promise.all([
    prisma.incidentCategory.findMany({ 
      include: { 
        children: true, 
        parent: true, 
        template: true,
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
    prisma.company.findMany({
      include: {
        _count: {
          select: {
            users: true,
            incidents: true
          }
        }
      }
    }),
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
    prisma.dataTemplate.findMany(),
  ]);
  return { categories, departments, locations, companies, rules, users, designations, templates };
}

import { checkAuth } from "@/lib/auth-utils";

export default async function MastersPage() {
  await checkAuth("SUPER_ADMIN");
  const data = await getMasterData();
  return <MastersClient data={data} />;
}
