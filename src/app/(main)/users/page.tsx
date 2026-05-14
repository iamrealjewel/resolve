import { prisma } from "@/lib/prisma";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Shield, Building2, MapPin, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DeleteUserButton } from "@/components/user-crud";
import { UserProvisioningDialog, EditUserDialog } from "@/components/user-form";
import { BulkUserUploadDialog } from "@/components/bulk-user-upload-dialog";
import { checkAuth } from "@/lib/auth-utils";
import { UsersTable } from "./users-table";
import { Card } from "@/components/ui/card";

async function getUsersData() {
  const [users, companies, departments, locations, designations, categories] = await Promise.all([
    prisma.user.findMany({
      include: { 
        company: true, 
        department: true, 
        location: true,
        designation: true,
        superior: true
      },
      orderBy: { name: "asc" },
    }),
    prisma.company.findMany(),
    prisma.department.findMany(),
    prisma.location.findMany(),
    prisma.designation.findMany(),
    prisma.incidentCategory.findMany(),
  ]);
  return { users, companies, departments, locations, designations, categories };
}

export default async function UsersPage() {
  await checkAuth("SUPER_ADMIN");
  const { users, companies, departments, locations, designations, categories } = await getUsersData();

  return (
    <div className="space-y-6 pb-10 px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-6 border-b">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Personnel Registry</h2>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Manage system access, roles, and hierarchical reporting lines.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BulkUserUploadDialog 
            companies={companies} 
            departments={departments} 
            locations={locations} 
            designations={designations}
            users={users}
            categories={categories}
          />
          <UserProvisioningDialog 
            companies={companies} 
            departments={departments} 
            locations={locations} 
            designations={designations}
            users={users}
            categories={categories}
          />
        </div>
      </div>

      <UsersTable 
        users={users} 
        companies={companies} 
        departments={departments} 
        locations={locations} 
        designations={designations} 
        categories={categories}
      />
    </div>
  );
}
// Infrastructure decoupled update
