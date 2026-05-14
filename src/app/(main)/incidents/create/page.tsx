import { getFormData } from "@/app/actions/incidents";
import { IncidentForm } from "@/components/incident-form";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";

export default async function CreateIncidentPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const [formData, user] = await Promise.all([
    getFormData(),
    prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { 
        id: true, 
        companyId: true, 
        locationId: true, 
        departmentId: true,
        restrictCategories: true,
        allowedCategories: { select: { id: true } }
      }
    })
  ]);

  return (
    <div className="h-screen overflow-hidden">
      <IncidentForm 
        mode="CREATE" 
        initialData={{
          companies: formData.companies,
          locations: formData.locations,
          categories: formData.categories,
          users: formData.users,
          sessionUser: user
        }} 
      />
    </div>
  );
}
