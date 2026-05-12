"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function approveIncident(incidentId: string, type: "BUSINESS" | "OPERATIONAL") {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  const userId = (session.user as any).id;

  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: { category: { include: { approvers: true } } }
  });

  if (!incident) throw new Error("Incident not found");

  // Permission check
  const isApprover = incident.raiserApproverId === userId || 
                    incident.resolverApproverId === userId ||
                    incident.category.approvers.some(a => a.userId === userId && a.type === (type === "BUSINESS" ? "RAISER" : "RESOLVER")) ||
                    (session.user as any).role === "SUPER_ADMIN" ||
                    ((session.user as any).role === "DEPARTMENT_HEAD" && incident.departmentId === (session.user as any).departmentId);

  if (!isApprover) throw new Error("You are not authorized to approve this incident");

  if (type === "BUSINESS") {
    // If operational approval is also required, move to that state
    const nextStatus = incident.category.requiresResolverApproval ? "PENDING_OPERATIONAL_APPROVAL" : "NEW";
    
    // Find operational approver if needed
    let resolverApproverId = null;
    if (incident.category.requiresResolverApproval) {
        const operationalOverrides = incident.category.approvers.filter(a => a.type === "RESOLVER");
        if (operationalOverrides.length > 0) {
            resolverApproverId = operationalOverrides[0].userId;
        } else {
            // Default to department head of the assigned department?
            // User said: "It would wait the resolver group's admins pending approval list."
            const deptHead = await prisma.user.findFirst({
                where: {
                    departmentId: incident.departmentId,
                    role: "DEPARTMENT_HEAD"
                }
            });
            resolverApproverId = deptHead?.id || null;
        }
    }

    await prisma.incident.update({
      where: { id: incidentId },
      data: { 
        status: nextStatus,
        resolverApproverId: resolverApproverId
      }
    });

    await prisma.incidentLog.create({
      data: {
        incidentId,
        userId,
        action: "BUSINESS_APPROVED",
        content: `Incident business approval granted by ${session.user.name}`
      }
    });
  } else {
    // Operational approval granted
    await prisma.incident.update({
      where: { id: incidentId },
      data: { status: "NEW" } // Once operational approval is done, it's effectively "NEW" but available for work
    });

    await prisma.incidentLog.create({
      data: {
        incidentId,
        userId,
        action: "OPERATIONAL_APPROVED",
        content: `Incident operational approval granted by ${session.user.name}`
      }
    });
  }

  revalidatePath("/incidents");
  revalidatePath(`/incidents/${incidentId}`);
  return { success: true };
}

export async function rejectIncident(incidentId: string, type: "BUSINESS" | "OPERATIONAL", reason: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  const userId = (session.user as any).id;

  await prisma.incident.update({
    where: { id: incidentId },
    data: { status: "REJECTED" }
  });

  await prisma.incidentLog.create({
    data: {
      incidentId,
      userId,
      action: type === "BUSINESS" ? "BUSINESS_REJECTED" : "OPERATIONAL_REJECTED",
      content: `Incident rejected during ${type.toLowerCase()} approval phase. Reason: ${reason}`
    }
  });

  revalidatePath("/incidents");
  revalidatePath(`/incidents/${incidentId}`);
  return { success: true };
}
