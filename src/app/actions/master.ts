"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { checkAuth } from "@/lib/auth-utils";
import { Role } from "@/lib/rbac";
import bcrypt from "bcryptjs";
import fs from "fs/promises";
import path from "path";

async function deleteOldImage(oldImageUrl: string | null | undefined, newImageUrl: string | null | undefined) {
  if (oldImageUrl && oldImageUrl !== newImageUrl && oldImageUrl.startsWith("/api/files/")) {
    const fileName = oldImageUrl.replace("/api/files/", "");
    const filePath = path.join(process.cwd(), "uploads_secure", fileName);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Failed to delete old image: ${filePath}`, error);
    }
  }
}

// --- COMPANY ---
export async function createCompany(data: { name: string; logo?: string }) {
  await checkAuth("SUPER_ADMIN");
  const company = await prisma.company.create({ data });
  revalidatePath("/org");
  return company;
}

export async function updateCompany(id: string, data: { name: string; logo?: string }) {
  await checkAuth(["SUPER_ADMIN", "DEPARTMENT_HEAD"]);
  const company = await prisma.company.update({ where: { id }, data });
  revalidatePath("/org");
  return company;
}

export async function deleteCompany(id: string) {
  await checkAuth("SUPER_ADMIN");
  await prisma.company.delete({ where: { id } });
  revalidatePath("/org");
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

// --- DATA TEMPLATE ---
export async function createDataTemplate(data: { 
  name: string; 
  description?: string; 
  fields: any 
}) {
  await checkAuth(["SUPER_ADMIN", "DEPARTMENT_HEAD"]);
  const template = await prisma.dataTemplate.create({ data });
  revalidatePath("/masters");
  return template;
}

export async function updateDataTemplate(id: string, data: { 
  name: string; 
  description?: string; 
  fields: any 
}) {
  await checkAuth(["SUPER_ADMIN", "DEPARTMENT_HEAD"]);
  const template = await prisma.dataTemplate.update({ 
    where: { id }, 
    data 
  });
  revalidatePath("/masters");
  return template;
}

export async function deleteDataTemplate(id: string) {
  await checkAuth(["SUPER_ADMIN", "DEPARTMENT_HEAD"]);
  await prisma.dataTemplate.delete({ where: { id } });
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
  templateId?: string | null;
}) {
  await checkAuth("SUPER_ADMIN");
  try {
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
  } catch (error: any) {
    console.error("CREATE_CATEGORY_ERROR:", error);
    throw new Error(error.message || "Failed to create category");
  }
}

export async function updateCategory(id: string, data: { 
  name: string; 
  parentId?: string | null;
  requiresRaiserApproval?: boolean;
  requiresResolverApproval?: boolean;
  raiserApprovers?: string[];
  resolverApprovers?: string[];
  templateId?: string | null;
}) {
  await checkAuth("SUPER_ADMIN");
  try {
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
  } catch (error: any) {
    console.error("UPDATE_CATEGORY_ERROR:", error);
    throw new Error(error.message || "Failed to update category");
  }
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
  image?: string | null;
  allowedCategoryIds?: string[];
}) {
  await checkAuth("SUPER_ADMIN");
  const { password, allowedCategoryIds, ...userData } = data;
  
  const hashedPassword = await bcrypt.hash(password || "password123", 10);

  const user = await prisma.user.create({
    data: {
      name: userData.name,
      email: userData.email,
      role: userData.role,
      password: hashedPassword,
      phone: userData.phone || null,
      image: data.image || null,
      company: { connect: { id: userData.companyId } },
      department: userData.departmentId ? { connect: { id: userData.departmentId } } : undefined,
      location: userData.locationId ? { connect: { id: userData.locationId } } : undefined,
      designation: userData.designationId ? { connect: { id: userData.designationId } } : undefined,
      superior: userData.superiorId ? { connect: { id: userData.superiorId } } : undefined,
      allowedCategories: allowedCategoryIds ? {
        connect: allowedCategoryIds.map(id => ({ id }))
      } : undefined
    }
  });
  revalidatePath("/users");
  return user;
}

export async function bulkUpsertUsers(users: any[]) {
  await checkAuth("SUPER_ADMIN");
  
  // Pre-hash passwords in parallel outside the transaction to prevent timeout
  const usersWithHashes = await Promise.all(
    users.map(async (userData) => {
      const { password, allowedCategoryIds, ...rest } = userData;
      let hashedPassword;
      if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }
      return { ...rest, password: hashedPassword, allowedCategoryIds };
    })
  );

  const results = await prisma.$transaction(async (tx) => {
    const output = [];
    for (const { email, allowedCategoryIds, ...data } of usersWithHashes) {
      const updateData: any = { ...data };
      if (!data.password) delete updateData.password;
      
      const user = await tx.user.upsert({
        where: { email },
        update: {
          name: data.name,
          role: data.role,
          phone: data.phone,
          image: data.image,
          password: data.password || undefined,
          company: data.companyId ? { connect: { id: data.companyId } } : undefined,
          department: data.departmentId ? { connect: { id: data.departmentId } } : (data.departmentId === null ? { disconnect: true } : undefined),
          location: data.locationId ? { connect: { id: data.locationId } } : (data.locationId === null ? { disconnect: true } : undefined),
          designation: data.designationId ? { connect: { id: data.designationId } } : (data.designationId === null ? { disconnect: true } : undefined),
          superior: data.superiorId ? { connect: { id: data.superiorId } } : (data.superiorId === null ? { disconnect: true } : undefined),
          allowedCategories: allowedCategoryIds ? {
            set: allowedCategoryIds.map((id: string) => ({ id }))
          } : undefined
        },
        create: {
          email,
          name: data.name,
          role: data.role,
          password: data.password || await bcrypt.hash("password123", 10),
          phone: data.phone || null,
          image: data.image || null,
          company: { connect: { id: data.companyId } },
          department: data.departmentId ? { connect: { id: data.departmentId } } : undefined,
          location: data.locationId ? { connect: { id: data.locationId } } : undefined,
          designation: data.designationId ? { connect: { id: data.designationId } } : undefined,
          superior: data.superiorId ? { connect: { id: data.superiorId } } : undefined,
          allowedCategories: allowedCategoryIds ? {
            connect: allowedCategoryIds.map((id: string) => ({ id }))
          } : undefined
        }
      });
      output.push(user);
    }
    return output;
  }, {
    timeout: 60000 
  });

  revalidatePath("/users");
  return results;
}

export async function updateUser(id: string, data: {
  name?: string;
  email?: string;
  role?: any;
  companyId?: string;
  password?: string;
  departmentId?: string | null;
  locationId?: string | null;
  designationId?: string | null;
  superiorId?: string | null;
  phone?: string | null;
  image?: string | null;
  allowedCategoryIds?: string[];
}) {
  await checkAuth("SUPER_ADMIN");
  const { password, allowedCategoryIds, ...userData } = data;
  
  const updateData: any = {
    name: userData.name,
    email: userData.email,
    role: userData.role,
    phone: userData.phone,
    image: userData.image,
  };

  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  if (userData.companyId) {
    updateData.company = { connect: { id: userData.companyId } };
  }

  if (userData.departmentId !== undefined) {
    updateData.department = userData.departmentId ? { connect: { id: userData.departmentId } } : { disconnect: true };
  }

  if (userData.locationId !== undefined) {
    updateData.location = userData.locationId ? { connect: { id: userData.locationId } } : { disconnect: true };
  }

  if (userData.designationId !== undefined) {
    updateData.designation = userData.designationId ? { connect: { id: userData.designationId } } : { disconnect: true };
  }

  if (userData.superiorId !== undefined) {
    updateData.superior = userData.superiorId ? { connect: { id: userData.superiorId } } : { disconnect: true };
  }

  if (allowedCategoryIds) {
    updateData.allowedCategories = {
      set: allowedCategoryIds.map(id => ({ id }))
    };
  }

  const existingUser = await prisma.user.findUnique({
    where: { id },
    select: { image: true }
  });

  const user = await prisma.user.update({
    where: { id },
    data: updateData
  });

  if (userData.image !== undefined) {
    await deleteOldImage(existingUser?.image, userData.image);
  }
  revalidatePath("/users");
  return user;
}

export async function deleteUser(id: string) {
  await checkAuth("SUPER_ADMIN");
  await prisma.user.delete({ where: { id } });
  revalidatePath("/users");
}

export async function changeOwnPassword(currentPass: string, newPass: string) {
  const session = await checkAuth();
  const userId = (session.user as any).id;
  
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");
  
  const isValid = await bcrypt.compare(currentPass, user.password);
  if (!isValid) throw new Error("Incorrect current password");
  
  const hashedPassword = await bcrypt.hash(newPass, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });
  
  return { success: true };
}

export async function updateProfile(data: { name?: string; phone?: string; image?: string | null }) {
  const session = await checkAuth();
  const userId = (session.user as any).id;
  
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { image: true }
  });

  const user = await prisma.user.update({
    where: { id: userId },
    data
  });
  
  if (data.image !== undefined) {
    await deleteOldImage(existingUser?.image, data.image);
  }
  
  revalidatePath("/profile");
  return user;
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
  revalidatePath("/masters");
}
