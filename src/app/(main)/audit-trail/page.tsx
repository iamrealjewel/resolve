import { prisma } from "@/lib/prisma";
import { checkAuth } from "@/lib/auth-utils";
import { getLogAccessFilter } from "@/lib/access-control";
import AuditClient from "./audit-client";
import { redirect } from "next/navigation";

export default async function AuditTrailPage() {
  const session = await checkAuth(["SUPER_ADMIN", "DEPARTMENT_HEAD", "LINE_MANAGER", "RESOLVER", "USER"]).catch(() => {
    redirect("/incidents");
  });

  if (!session) return null;
  const user = session.user as any;

  // Fetch all logs authorized for the user
  const logs = await prisma.incidentLog.findMany({
    where: getLogAccessFilter(user),
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      },
      incident: {
        select: {
          id: true,
          ticketId: true,
          title: true,
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 1000 // In a real app, this should be paginated
  });

  const users = await prisma.user.findMany({
    where: user.role === "SUPER_ADMIN" ? {} : { companyId: user.companyId },
    select: {
      id: true,
      name: true,
    }
  });

  return <AuditClient logs={logs} users={users} />;
}
