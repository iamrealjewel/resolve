import { prisma } from "@/lib/prisma";
import { OrgClient } from "./org-client";

async function getOrgData() {
  const companies = await prisma.company.findMany({
    include: {
      _count: {
        select: { users: true, incidents: true }
      }
    }
  });
  return companies;
}

import { checkAuth } from "@/lib/auth-utils";

export default async function OrgPage() {
  await checkAuth(["SUPER_ADMIN", "DEPARTMENT_HEAD"]);
  const companies = await getOrgData();

  return <OrgClient companies={companies} />;
}
