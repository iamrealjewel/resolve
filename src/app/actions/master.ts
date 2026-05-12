"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { checkAuth } from "@/lib/auth-utils";
import { Role } from "@/lib/rbac";
import bcrypt from "bcryptjs";

// --- COMPANY ---
export async function createCompany(data: { name: string; logo?: string }) {
  await checkAuth("SUPER_ADMIN");
  const company = await prisma.company.create({ data });
  revalidatePath("/org");
  revalidatePath("/settings");
  return company;
}

export async function updateCompany(id: string, data: { name: string; logo?: string }) {
  await checkAuth(["SUPER_ADMIN", "DEPARTMENT_HEAD"]);
  const company = await prisma.company.update({ where: { id }, data });
  revalidatePath("/org");
  revalidatePath("/settings");
  return company;
}

export async function deleteCompany(id: string) {
  await checkAuth("SUPER_ADMIN");
  await prisma.company.delete({ where: { id } });
  revalidatePath("/org");
  revalidatePath("/settings");
}

// --- DEPARTMENT ---
export async function createDepartment(data: { name: string; parentId?: string | null }) {
  await checkAuth(["SUPER_ADMIN", "DEPARTMENT_HEAD"]);
  const department = await prisma.department.create({ data });
  revalidatePath("/org");
  revalidatePath("/masters");
  return department;
}

export async function updateDepartment(id: string, data: { name: string; parentId?: string | null }) {
  await checkAuth(["SUPER_ADMIN", "DEPARTMENT_HEAD"]);
  const department = await prisma.department.update({ where: { id }, data });
  revalidatePath("/org");
  revalidatePath("/masters");
  return department;
}

export async function deleteDepartment(id: string) {
  await checkAuth(["SUPER_ADMIN", "DEPARTMENT_HEAD"]);
  await prisma.department.delete({ where: { id } });
  revalidatePath("/org");
  revalidatePath("/masters");
}

// --- LOCATION ---
export async function createLocation(data: { name: string }) {
  await checkAuth(["SUPER_ADMIN", "DEPARTMENT_HEAD"]);
  const location = await prisma.location.create({ data });
  revalidatePath("/org");
  revalidatePath("/masters");
  return location;
}

export async function updateLocation(id: string, data: { name: string }) {
  await checkAuth(["SUPER_ADMIN", "DEPARTMENT_HEAD"]);
  const location = await prisma.location.update({ where: { id }, data });
  revalidatePath("/org");
  revalidatePath("/masters");
  return location;
}

export async function deleteLocation(id: string) {
  await checkAuth(["SUPER_ADMIN", "DEPARTMENT_HEAD"]);
  await prisma.location.delete({ where: { id } });
  revalidatePath("/org");
  revalidatePath("/masters");
}

// --- DESIGNATION ---
export async function createDesignation(data: { title: string }) {
  await checkAuth(["SUPER_ADMIN", "DEPARTMENT_HEAD"]);
  const designation = await prisma.designation.create({ data });
  revalidatePath("/masters");
  revalidatePath("/users");
  return designation;
}

export async function updateDesignation(id: string, data: { title: string }) {
  await checkAuth(["SUPER_ADMIN", "DEPARTMENT_HEAD"]);
  const designation = await prisma.designation.update({ where: { id }, data });
  revalidatePath("/masters");
  revalidatePath("/users");
  return designation;
}

export async function deleteDesignation(id: string) {
  await checkAuth(["SUPER_ADMIN", "DEPARTMENT_HEAD"]);
  await prisma.designation.delete({ where: { id } });
  revalidatePath("/masters");
  revalidatePath("/users");
}

// --- CATEGORY ---
export async function createCategory(data: { 
  name: string; 
  parentId?: string | null;
  requiresRaiserApproval?: boolean;
  requiresResolverApproval?: boolean;
  raiserApprovers?: string[];
  resolverApprovers?: string[];
}) {
  await checkAuth("SUPER_ADMIN");
  const { raiserApprovers, resolverApprovers, ...categoryData } = data;
  
  const raiserList = raiserApprovers?.filter(Boolean) || [];
  const resolverList = resolverApprovers?.filter(Boolean) || [];

  const category = await prisma.incidentCategory.create({ 
    data: {
      ...categoryData,
      approvers: {
        create: [
          ...raiserList.map(userId => ({ userId, type: "RAISER" })),
          ...resolverList.map(userId => ({ userId, type: "RESOLVER" }))
        ]
      }
    }
  });
  revalidatePath("/masters");
  return category;
}

export async function updateCategory(id: string, data: { 
  name: string; 
  parentId?: string | null;
  requiresRaiserApproval?: boolean;
  requiresResolverApproval?: boolean;
  raiserApprovers?: string[];
  resolverApprovers?: string[];
}) {
  await checkAuth("SUPER_ADMIN");
  const { raiserApprovers, resolverApprovers, ...categoryData } = data;

  const raiserList = raiserApprovers?.filter(Boolean) || [];
  const resolverList = resolverApprovers?.filter(Boolean) || [];

  const category = await prisma.$transaction(async (tx) => {
    // 1. Delete existing approvers
    await tx.categoryApprover.deleteMany({
      where: { categoryId: id }
    });

    // 2. Update category and create new approvers
    return tx.incidentCategory.update({
      where: { id },
      data: {
        ...categoryData,
        approvers: {
          create: [
            ...raiserList.map(userId => ({ userId, type: "RAISER" })),
            ...resolverList.map(userId => ({ userId, type: "RESOLVER" }))
          ]
        }
      }
    });
  });

  revalidatePath("/masters");
  return category;
}

export async function deleteCategory(id: string) {
  await checkAuth("SUPER_ADMIN");
  await prisma.incidentCategory.delete({ where: { id } });
  revalidatePath("/reports");
  revalidatePath("/masters");
}

// --- USER ---
export async function provisionUser(data: {
  email: string;
  name: string;
  role: any; // Type mismatch from enum
  companyId: string;
  password?: string;
  departmentId?: string | null;
  locationId?: string | null;
  designationId?: string | null;
  superiorId?: string | null;
  phone?: string | null;
}) {
  await checkAuth("SUPER_ADMIN");
  const { password, ...userData } = data;
  
  const hashedPassword = await bcrypt.hash(password || "password123", 10);

  const user = await prisma.user.create({
    data: {
      ...userData,
      password: hashedPassword,
    }
  });
  revalidatePath("/users");
  return user;
}

export async function updateUser(id: string, data: {
  name?: string;
  role?: any;
  companyId?: string;
  password?: string;
  departmentId?: string | null;
  locationId?: string | null;
  designationId?: string | null;
  superiorId?: string | null;
  phone?: string | null;
}) {
  await checkAuth("SUPER_ADMIN");
  const { password, ...userData } = data;
  
  const updateData: any = { ...userData };
  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData
  });
  revalidatePath("/users");
  return user;
}

export async function deleteUser(id: string) {
  await checkAuth("SUPER_ADMIN");
  await prisma.user.delete({ where: { id } });
  revalidatePath("/users");
}

// --- ROUTING RULE ---
export async function createRoutingRule(data: { 
  categoryId: string; 
  departmentId: string;
}) {
  await checkAuth("SUPER_ADMIN");
  const rule = await prisma.routingRule.create({ data });
  revalidatePath("/masters");
  return rule;
}

export async function updateRoutingRule(id: string, data: { 
  categoryId?: string; 
  departmentId?: string;
}) {
  await checkAuth("SUPER_ADMIN");
  const rule = await prisma.routingRule.update({ where: { id }, data });
  revalidatePath("/masters");
  return rule;
}

export async function deleteRoutingRule(id: string) {
  await checkAuth("SUPER_ADMIN");
  await prisma.routingRule.delete({ where: { id } });
  revalidatePath("/settings");
  revalidatePath("/masters");
}
