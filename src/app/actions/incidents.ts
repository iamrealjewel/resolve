"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { checkAuth } from "@/lib/auth-utils";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import fs from "fs/promises";
import path from "path";

async function findRoutingRule(categoryId: string) {
  let currentId = categoryId;
  const allCategories = await prisma.incidentCategory.findMany({
    select: { id: true, parentId: true }
  });

  while (currentId) {
    const rule = await prisma.routingRule.findFirst({
      where: { categoryId: currentId }
    });
    if (rule) return rule;

    const cat = allCategories.find(c => c.id === currentId);
    currentId = cat?.parentId || "";
  }
  return null;
}

export async function getResolverCategoryIds(departmentId: string) {
  if (!departmentId) {

    return [];
  }


  const rules = await prisma.routingRule.findMany({
    where: { departmentId },
    select: { categoryId: true }
  });

  const rootCategoryIds = rules.map(r => r.categoryId);

  if (rootCategoryIds.length === 0) return [];


  const allCategories = await prisma.incidentCategory.findMany({
    select: { id: true, parentId: true }
  });


  const descendantIds = new Set<string>();
  const findDescendants = (parentId: string) => {
    if (descendantIds.has(parentId)) return;
    descendantIds.add(parentId);
    allCategories.filter(c => c.parentId === parentId).forEach(c => findDescendants(c.id));
  };

  rootCategoryIds.forEach(id => findDescendants(id));


  return Array.from(descendantIds);
}

export async function getIncidents(tab: string = "all") {
  const session = await getServerSession(authOptions);
  if (!session?.user) return [];

  // Fetch fresh user data to avoid stale session/JWT issues
  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id }
  });

  if (!user) return [];



  const where: any = {};

  // Role-based visibility logic replaces the global companyId filter
  if (tab === "my") {
    where.reporterId = user.id;
  } else if (tab === "pending") {
    if (user.role === "SUPER_ADMIN") {
      where.status = { in: ["PENDING_BUSINESS_APPROVAL", "PENDING_OPERATIONAL_APPROVAL"] };
    } else if (user.role === "DEPARTMENT_HEAD") {
      where.AND = [
        { status: { in: ["PENDING_BUSINESS_APPROVAL", "PENDING_OPERATIONAL_APPROVAL"] } },
        { departmentId: user.departmentId }
      ];
    } else {
      where.OR = [
        { raiserApproverId: user.id, status: "PENDING_BUSINESS_APPROVAL" },
        { resolverApproverId: user.id, status: "PENDING_OPERATIONAL_APPROVAL" },
        {
          category: {
            approvers: {
              some: {
                userId: user.id,
                type: "RAISER"
              }
            }
          },
          status: "PENDING_BUSINESS_APPROVAL"
        },
        {
          category: {
            approvers: {
              some: {
                userId: user.id,
                type: "RESOLVER"
              }
            }
          },
          status: "PENDING_OPERATIONAL_APPROVAL"
        }
      ];
    }
  } else {
    // "all" tab - Role based
    if (user.role === "SUPER_ADMIN") {
      // Super Admin sees everything in their company
    } else if (user.role === "DEPARTMENT_HEAD" || user.role === "LINE_MANAGER") {
      const resolverCatIds = await getResolverCategoryIds(user.departmentId);
      where.OR = [
        { departmentId: user.departmentId },
        { categoryId: { in: resolverCatIds } },
        { reporter: { superiorId: user.id } },
        { accessList: { some: { id: user.id } } }
      ];
    } else if (user.role === "RESOLVER") {
      const resolverCatIds = await getResolverCategoryIds(user.departmentId);
      where.AND = [
        {
          OR: [
            { departmentId: user.departmentId },
            { categoryId: { in: resolverCatIds } },
            { accessList: { some: { id: user.id } } }
          ]
        },
        { status: { notIn: ["PENDING_BUSINESS_APPROVAL"] } }
      ];
    } else {
      where.OR = [
        { reporterId: user.id },
        { accessList: { some: { id: user.id } } }
      ];
    }
  }


  try {
    const incidents = await prisma.incident.findMany({
      where,
      include: {
        company: true,
        location: true,
        category: {
          include: {
            rules: true
          }
        },
        reporter: true,
        assignee: true,
        accessList: true,
        attachments: true,
        logs: {
          include: {
            user: true,
            attachments: true
          },
          orderBy: { createdAt: "desc" }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    });


    return incidents;
  } catch (error: any) {

    throw error;
  }
}

export async function getIncidentStats(sessionUser: any) {
  if (!sessionUser) return { allCount: 0, myCount: 0, pendingCount: 0 };

  // Fetch fresh user data to avoid stale session/JWT issues
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id }
  });

  if (!user) return { allCount: 0, myCount: 0, pendingCount: 0 };

  const resolverCatIds = (user.role === "RESOLVER" || user.role === "DEPARTMENT_HEAD" || user.role === "LINE_MANAGER")
    ? await getResolverCategoryIds(user.departmentId)
    : [];

  const [allCount, myCount, pendingCount] = await Promise.all([
    prisma.incident.count({
      where: {
        ...(user.role === "SUPER_ADMIN" ? {} :
          {
            ...(user.role === "DEPARTMENT_HEAD" || user.role === "LINE_MANAGER" ?
              { OR: [{ departmentId: user.departmentId }, { categoryId: { in: resolverCatIds } }, { reporter: { superiorId: user.id } }, { accessList: { some: { id: user.id } } }] } :
              (user.role === "RESOLVER" ?
                {
                  AND: [
                    {
                      OR: [
                        { departmentId: user.departmentId },
                        { categoryId: { in: resolverCatIds } },
                        { accessList: { some: { id: user.id } } }
                      ]
                    },
                    { status: { notIn: ["PENDING_BUSINESS_APPROVAL", "PENDING_OPERATIONAL_APPROVAL"] } }
                  ]
                } :
                { OR: [{ reporterId: user.id }, { accessList: { some: { id: user.id } } }] }))
          })
      }
    }),
    prisma.incident.count({ where: { reporterId: user.id } }),
    prisma.incident.count({
      where: {
        ...(user.role === "SUPER_ADMIN" ? 
          { status: { in: ["PENDING_BUSINESS_APPROVAL", "PENDING_OPERATIONAL_APPROVAL"] } } :
          (user.role === "DEPARTMENT_HEAD" ?
            { AND: [
                { status: { in: ["PENDING_BUSINESS_APPROVAL", "PENDING_OPERATIONAL_APPROVAL"] } },
                { departmentId: user.departmentId }
              ]
            } :
            {
              OR: [
                { raiserApproverId: user.id, status: "PENDING_BUSINESS_APPROVAL" },
                { resolverApproverId: user.id, status: "PENDING_OPERATIONAL_APPROVAL" },
                {
                  category: {
                    approvers: {
                      some: {
                        userId: user.id,
                        type: "RAISER"
                      }
                    }
                  },
                  status: "PENDING_BUSINESS_APPROVAL"
                },
                {
                  category: {
                    approvers: {
                      some: {
                        userId: user.id,
                        type: "RESOLVER"
                      }
                    }
                  },
                  status: "PENDING_OPERATIONAL_APPROVAL"
                }
              ]
            }
          )
        )
      }
    }),
  ]);

  return { allCount, myCount, pendingCount };
}

export async function createIncident(formData: any) {
  const session = await checkAuth();
  const creatorId = (session.user as any).id;
  const actualReporterId = formData.reporterId || creatorId;
  const catId = formData.category;

  const category = await prisma.incidentCategory.findUnique({
    where: { id: catId },
    include: { approvers: true }
  });
  const requiresRaiserApproval = category?.requiresRaiserApproval || false;

  let raiserApproverId = null;
  if (requiresRaiserApproval) {
    if (category?.approvers && category.approvers.length > 0) {
      // Use override approvers
      raiserApproverId = category.approvers[0].userId;
    } else {
      // Use default reporting line
      const reporter = await prisma.user.findUnique({
        where: { id: actualReporterId },
        select: { superiorId: true, departmentId: true }
      });

      if (reporter?.superiorId) {
        raiserApproverId = reporter.superiorId;
      } else {
        const deptHead = await prisma.user.findFirst({
          where: {
            departmentId: reporter?.departmentId,
            role: "DEPARTMENT_HEAD"
          }
        });
        raiserApproverId = deptHead?.id || null;
      }
    }
  }

  const requiresResolverApproval = category?.requiresResolverApproval || false;

  let initialStatus = "NEW";
  let resolverApproverId = null;

  if (requiresRaiserApproval) {
    initialStatus = "PENDING_BUSINESS_APPROVAL";
  } else if (requiresResolverApproval) {
    initialStatus = "PENDING_OPERATIONAL_APPROVAL";
    
    // Find operational approver
    const operationalOverrides = category?.approvers.filter(a => a.type === "RESOLVER") || [];
    if (operationalOverrides.length > 0) {
      resolverApproverId = operationalOverrides[0].userId;
    } else {
      // Default to assigned department head
      const rule = await findRoutingRule(catId);
      const targetDeptId = rule?.departmentId || formData.department || (session.user as any).departmentId;
      const deptHead = await prisma.user.findFirst({
        where: {
          departmentId: targetDeptId,
          role: "DEPARTMENT_HEAD"
        }
      });
      resolverApproverId = deptHead?.id || null;
    }
  }

  const rule = await findRoutingRule(catId);
  const ticketId = `TKT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const incident = await prisma.incident.create({
    data: {
      ticketId,
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      status: initialStatus,
      company: { connect: { id: formData.company } },
      location: formData.location ? { connect: { id: formData.location } } : undefined,
      category: { connect: { id: catId } },
      department: { connect: { id: rule?.departmentId || formData.department || (session.user as any).departmentId } },
      reporter: { connect: { id: actualReporterId } },
      raiserApprover: raiserApproverId ? { connect: { id: raiserApproverId } } : undefined,
      resolverApprover: resolverApproverId ? { connect: { id: resolverApproverId } } : undefined,
      accessList: {
        set: [], // Clear first
        connect: formData.accessList?.map((id: string) => ({ id })) || []
      },
      templateData: formData.templateData || [],
      attachments: {
        create: formData.attachments?.map((a: any) => ({
          name: a.name,
          url: a.url,
          fileType: a.fileType,
          fileSize: a.fileSize
        })) || []
      }
    },
  });

  await prisma.incidentLog.create({
    data: {
      incidentId: incident.id,
      userId: creatorId,
      action: "CREATED",
      content: actualReporterId !== creatorId
        ? `Incident reported on behalf of another user.`
        : `Incident reported through portal.`,
    },
  });

  if (formData.attachments?.length > 0) {
    await prisma.incidentLog.create({
      data: {
        incidentId: incident.id,
        userId: creatorId,
        action: "DETAIL_UPDATE",
        content: `Attached ${formData.attachments.length} initial evidence files.`,
      },
    });
  }

  revalidatePath("/incidents");
  revalidatePath("/dashboard");
  return incident;
}

export async function getIncident(id: string) {
  if (!id) return null;
  const session = await checkAuth();

  // Fetch fresh user data to avoid stale session/JWT issues
  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id }
  });

  if (!user) return null;

  const incident = await prisma.incident.findUnique({
    where: { id },
    include: {
      company: true,
      location: true,
      category: true,
      reporter: true,
      assignee: true,
      accessList: true,
      attachments: true,
      logs: {
        include: {
          user: true,
          attachments: true
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!incident) return null;

  // Visibility Check
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const isReporter = incident.reporterId === user.id;
  const isAssignee = incident.assigneeId === user.id;
  const isApprover = incident.raiserApproverId === user.id || incident.resolverApproverId === user.id;
  const mgrResolverCatIds = (user.role === "DEPARTMENT_HEAD" || user.role === "LINE_MANAGER") ? await getResolverCategoryIds(user.departmentId) : [];
  const isDeptHead = (user.role === "DEPARTMENT_HEAD" || user.role === "LINE_MANAGER") && (
    incident.departmentId === user.departmentId ||
    (incident.reporter as any).superiorId === user.id ||
    mgrResolverCatIds.includes(incident.categoryId)
  );
  const isTagged = (incident as any).accessList?.some((u: any) => u.id === user.id);

  const resolverCatIds = user.role === "RESOLVER" ? await getResolverCategoryIds(user.departmentId) : [];
  const isResolverForCategory = user.role === "RESOLVER" && (
    incident.departmentId === user.departmentId ||
    resolverCatIds.includes(incident.categoryId)
  );

  if (!isSuperAdmin && !isReporter && !isAssignee && !isApprover && !isDeptHead && !isTagged && !isResolverForCategory) {
    throw new Error("Forbidden: You do not have permission to view this incident.");
  }

  return incident;
}

export async function updateIncident(id: string, data: any) {
  const session = await checkAuth();
  const user = session.user as any;

  const incident = await prisma.incident.findUnique({
    where: { id },
    include: { category: true, reporter: true }
  });

  if (!incident) throw new Error("Incident not found");

  // Expanded Authorization Check
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const isReporter = incident.reporterId === user.id;
  const isLineManagerOfReporter = incident.reporter.superiorId === user.id;
  const isDeptHeadOfReporter = incident.departmentId === user.departmentId && user.role === "DEPARTMENT_HEAD";
  const isAssignee = incident.assigneeId === user.id;

  // Also check if user is a resolver for this incident
  const isResolverForCategory = user.role === "RESOLVER" && (
    incident.departmentId === user.departmentId ||
    incident.category.rules?.some((r: any) => r.departmentId === user.departmentId)
  );

  const isRestrictedRaiser = isReporter && !isSuperAdmin;

  if (isRestrictedRaiser) {
    throw new Error("Unauthorized: Reporters cannot edit incidents after submission.");
  }

  const updateData: any = {
    title: data.title,
    description: data.description,
    priority: data.priority,
    categoryId: data.categoryId || incident.categoryId,
    locationId: data.locationId || incident.locationId,
    companyId: data.companyId || incident.companyId,
    templateData: data.templateData || incident.templateData || [],
    accessList: data.accessList ? {
      set: data.accessList.map((uid: string) => ({ id: uid }))
    } : undefined,
  };

  // Only non-restricted users can change status or assignee
  if (!isRestrictedRaiser || isSuperAdmin || isResolverForCategory) {
    if (data.status) updateData.status = data.status;
    if (data.assigneeId !== undefined) {
      updateData.assigneeId = data.assigneeId === "PENDING_ASSIGNMENT" ? null : data.assigneeId;
    }
  }

  // Handle Attachments (Sync deletion and creation)
  const incidentWithAttachments = await prisma.incident.findUnique({
    where: { id },
    include: { attachments: true }
  });

  if (!incidentWithAttachments) throw new Error("Incident not found");

  const currentAttachmentIds = incidentWithAttachments.attachments.map(a => a.id);
  const keptAttachmentIds = data.attachments?.filter((a: any) => a.id).map((a: any) => a.id) || [];
  const removedAttachmentIds = currentAttachmentIds.filter(id => !keptAttachmentIds.includes(id));
  const newAttachments = data.attachments?.filter((a: any) => !a.id) || [];

  if (removedAttachmentIds.length > 0 || newAttachments.length > 0) {
    updateData.attachments = {
      deleteMany: removedAttachmentIds.length > 0 ? { id: { in: removedAttachmentIds } } : undefined,
      create: newAttachments.map((a: any) => ({
        name: a.name,
        url: a.url,
        fileType: a.fileType,
        fileSize: a.fileSize
      }))
    };
  }

  // Generate detailed audit logs for changed fields
  const logEntries = [];
  
  if (data.title && data.title !== incident.title) {
    logEntries.push({ userId: user.id, action: "DETAIL_UPDATE", content: `Title changed from "${incident.title}" to "${data.title}"` });
  }
  if (data.description && data.description !== incident.description) {
    logEntries.push({ userId: user.id, action: "DETAIL_UPDATE", content: `Description updated.` });
  }
  if (data.priority && data.priority !== incident.priority) {
    logEntries.push({ userId: user.id, action: "DETAIL_UPDATE", content: `Priority changed from ${incident.priority} to ${data.priority}` });
  }
  if (data.categoryId && data.categoryId !== incident.categoryId) {
    const oldCat = incident.category?.name || "Unknown";
    const newCat = (await prisma.incidentCategory.findUnique({ where: { id: data.categoryId } }))?.name || "Unknown";
    logEntries.push({ userId: user.id, action: "DETAIL_UPDATE", content: `Category changed from "${oldCat}" to "${newCat}"` });
  }
  if (data.status && data.status !== incident.status) {
    logEntries.push({ userId: user.id, action: "STATUS_CHANGE", content: `Status changed from ${incident.status} to ${data.status}` });
  }
  if (updateData.assigneeId !== undefined && updateData.assigneeId !== incident.assigneeId) {
    const oldUser = incident.assigneeId ? await prisma.user.findUnique({ where: { id: incident.assigneeId } }) : null;
    const newUser = updateData.assigneeId ? await prisma.user.findUnique({ where: { id: updateData.assigneeId } }) : null;
    
    const oldName = oldUser?.name || "Unassigned";
    const newName = newUser?.name || "Unassigned";
    
    logEntries.push({ 
      userId: user.id, 
      action: "ASSIGNMENT", 
      content: `Assignee changed from "${oldName}" to "${newName}"` 
    });
  }
  if (newAttachments.length > 0) {
    logEntries.push({ userId: user.id, action: "DETAIL_UPDATE", content: `Uploaded ${newAttachments.length} new evidence files.` });
  }

  // If no specific changes detected but update called, log a general update
  if (logEntries.length === 0) {
    logEntries.push({ userId: user.id, action: "DETAIL_UPDATE", content: `Incident updated by ${user.name}.` });
  }

  const updatedIncident = await prisma.incident.update({
    where: { id },
    data: {
      ...updateData,
      logs: {
        create: logEntries.map(log => ({
          userId: log.userId,
          action: log.action,
          content: log.content,
        })),
      },
    },
  });

  revalidatePath(`/incidents/${id}`);
  revalidatePath("/incidents");
  return updatedIncident;
}

export async function addComment(id: string, content: string, attachments?: any[]) {
  const session = await checkAuth();
  const user = session.user as any;

  await prisma.incidentLog.create({
    data: {
      incidentId: id,
      userId: user.id,
      action: "COMMENT",
      content: content,
      attachments: {
        create: attachments?.map((a: any) => ({
          name: a.name,
          url: a.url,
          fileType: a.fileType,
          fileSize: a.fileSize
        })) || []
      }
    },
  });

  revalidatePath(`/incidents/${id}`);
}

export async function assignIncident(id: string, assigneeId?: string) {
  const session = await checkAuth();
  const user = session.user as any;

  // Fetch fresh user data
  const freshUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!freshUser) throw new Error("User not found");

  const targetAssigneeId = assigneeId || freshUser.id;

  const incident = await prisma.incident.findUnique({
    where: { id },
    include: {
      category: true,
      reporter: true
    }
  });

  if (!incident) throw new Error("Incident not found");

  const isSuperAdmin = freshUser.role === "SUPER_ADMIN";

  // Raisers can never assign
  if (incident.reporterId === freshUser.id && !isSuperAdmin) {
    throw new Error("Unauthorized: Incident raisers cannot change the assignee.");
  }

  // Raiser's Line Manager can never assign
  if (incident.reporter.superiorId === freshUser.id && !isSuperAdmin) {
    throw new Error("Unauthorized: Raiser's line manager cannot assign this incident.");
  }

  // Raiser's Department Head can never assign (if the user is the DH of the reporter's department)
  if (incident.reporter.departmentId === freshUser.departmentId && freshUser.role === "DEPARTMENT_HEAD" && !isSuperAdmin) {
    throw new Error("Unauthorized: Raiser's department head cannot assign this incident.");
  }

  if (!isSuperAdmin) {
    const isResolverRole = ["RESOLVER", "DEPARTMENT_HEAD", "LINE_MANAGER"].includes(freshUser.role);
    if (!isResolverRole) {
      throw new Error("Unauthorized: Only resolver-department personnel can assign incidents.");
    }

    // Verify the acting user belongs to the resolver department for this incident
    const resolverDeptIds = await prisma.routingRule.findMany({
      where: { categoryId: incident.categoryId },
      select: { departmentId: true }
    });
    const resolverDeptIdList = resolverDeptIds.map(r => r.departmentId);

    // If the incident has a direct department, include that too
    if (incident.departmentId) resolverDeptIdList.push(incident.departmentId);

    if (!resolverDeptIdList.includes(freshUser.departmentId)) {
      throw new Error("Unauthorized: You are not part of the resolver department for this incident.");
    }

    // If assigning to someone else, verify they are in the same department
    if (targetAssigneeId !== freshUser.id) {
      const targetUser = await prisma.user.findUnique({ where: { id: targetAssigneeId } });
      if (!targetUser || !resolverDeptIdList.includes(targetUser.departmentId)) {
        throw new Error("Unauthorized: You can only assign to members of the same resolver department.");
      }
    }
  }

  const targetUser = await prisma.user.findUnique({ where: { id: targetAssigneeId } });
  const oldUser = incident.assigneeId ? await prisma.user.findUnique({ where: { id: incident.assigneeId } }) : null;
  
  if (incident.assigneeId === targetAssigneeId) {
    return incident; // No change
  }

  const updatedIncident = await prisma.incident.update({
    where: { id },
    data: {
      assigneeId: targetAssigneeId,
      status: "ASSIGNED", // Automatically WIP
      logs: {
        create: [
          {
            userId: freshUser.id,
            action: "ASSIGNMENT",
            content: targetAssigneeId === freshUser.id
              ? `Incident self-assigned by ${freshUser.name}. (Previous: ${oldUser?.name || "Unassigned"})`
              : `Incident reassigned from "${oldUser?.name || "Unassigned"}" to "${targetUser?.name || "user"}" by ${freshUser.name}.`,
          },
          {
            userId: freshUser.id,
            action: "STATUS_CHANGE",
            content: `Status automatically updated to WIP (ASSIGNED) upon assignment.`,
          }
        ],
      },
    },
  });

  revalidatePath(`/incidents/${id}`);
  revalidatePath("/incidents");
  return updatedIncident;
}

export async function updateIncidentStatus(id: string, status: any, content: string) {
  const session = await checkAuth();
  const user = session.user as any;

  const incident = await prisma.incident.findUnique({ where: { id } });
  if (!incident) throw new Error("Incident not found");

  // Authorization: Only Assignee or SuperAdmin or ResolverApprover
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const isAssignee = incident.assigneeId === user.id;
  const isApprover = incident.resolverApproverId === user.id;

  if (!isSuperAdmin && !isAssignee && !isApprover) {
    throw new Error("Forbidden: You do not have permission to update this incident.");
  }

  const updateData: any = { status };
  await prisma.incident.update({
    where: { id },
    data: updateData,
  });

  await prisma.incidentLog.create({
    data: {
      incidentId: id,
      userId: user.id,
      action: "STATUS_CHANGE",
      content: `Status updated to ${status}. ${content}`,
    },
  });

  revalidatePath(`/incidents/${id}`);
  revalidatePath("/incidents");
}

export async function approveIncident(id: string, content: string) {
  const session = await checkAuth();
  const user = session.user as any;

  const incident = await prisma.incident.findUnique({
    where: { id },
    include: { category: true }
  });

  if (!incident) throw new Error("Incident not found");

  // Authorization: Must be the designated approver or SuperAdmin
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const isCurrentApprover = (incident.status === "PENDING_RAISER_APPROVAL" && incident.raiserApproverId === user.id) ||
    (incident.status === "PENDING_RESOLVER_APPROVAL" && incident.resolverApproverId === user.id);

  if (!isSuperAdmin && !isCurrentApprover) {
    throw new Error("Forbidden: You are not authorized to approve this incident at this stage.");
  }

  let nextStatus = "NEW";
  let resolverApproverId = null;

  if (incident.status === "PENDING_RAISER_APPROVAL") {
    if (incident.category.requiresResolverApproval) {
      nextStatus = "PENDING_RESOLVER_APPROVAL";
      const deptHead = await prisma.user.findFirst({
        where: {
          departmentId: incident.departmentId,
          role: "DEPARTMENT_HEAD"
        }
      });
      resolverApproverId = deptHead?.id || null;
    } else {
      nextStatus = "NEW";
    }
  } else if (incident.status === "PENDING_RESOLVER_APPROVAL") {
    nextStatus = "ASSIGNED";
  }

  await prisma.incident.update({
    where: { id },
    data: {
      status: nextStatus,
      resolverApproverId: resolverApproverId || incident.resolverApproverId
    },
  });

  await prisma.incidentLog.create({
    data: {
      incidentId: id,
      userId: user.id,
      action: "APPROVED",
      content: `Stage authorization completed: ${nextStatus}. ${content}`,
    },
  });

  revalidatePath(`/incidents/${id}`);
  revalidatePath("/incidents");
}

export async function getFormData() {
  await checkAuth();
  const [companies, locations, categories, users] = await Promise.all([
    prisma.company.findMany(),
    prisma.location.findMany(),
    prisma.incidentCategory.findMany({
      include: {
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
        },
        rules: {
          include: {
            department: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    }),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        company: { select: { name: true } },
        department: { select: { name: true } },
        designation: { select: { title: true } }
      }
    }),
  ]);

  return { companies, locations, categories, users };
}

export async function getResolverDeptUsers(incidentId: string) {
  await checkAuth();

  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    select: { categoryId: true, departmentId: true }
  });

  if (!incident) return [];

  const rule = await findRoutingRule(incident.categoryId);
  let rootDeptIds: string[] = [];

  if (rule) {
    // Rule takes absolute precedence
    rootDeptIds = [rule.departmentId];
  } else if (incident.departmentId) {
    // Use stored department only if no rule exists
    rootDeptIds = [incident.departmentId];
  }

  if (rootDeptIds.length === 0) return [];

  // Recursive fetch for all descendant departments
  const allDepts = await prisma.department.findMany({
    select: { id: true, parentId: true }
  });

  const resolvedDeptIds = new Set<string>();
  const findDescendants = (parentId: string) => {
    if (resolvedDeptIds.has(parentId)) return;
    resolvedDeptIds.add(parentId);
    allDepts.filter(d => d.parentId === parentId).forEach(d => findDescendants(d.id));
  };

  rootDeptIds.forEach(id => findDescendants(id));

  return await prisma.user.findMany({
    where: { departmentId: { in: Array.from(resolvedDeptIds) } },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: { select: { name: true } }
    }
  });
}

export async function uploadFile(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) return null;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  const filePath = path.join(uploadDir, fileName);

  await fs.writeFile(filePath, buffer);

  return {
    name: file.name,
    url: `/uploads/${fileName}`,
    fileType: file.type,
    fileSize: file.size,
  };
}
