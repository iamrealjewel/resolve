import { getIncident, getFormData } from "@/app/actions/incidents";
import { notFound } from "next/navigation";
import { IncidentForm } from "@/components/incident-form";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";
import { formatDistanceToNow } from "date-fns";

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const incident = await getIncident(id);
  const formData = await getFormData();

  if (!incident) {
    notFound();
  }

  return (
    <div>

      <IncidentForm 
        mode="VIEW" 
        initialData={{
          companies: formData.companies,
          locations: formData.locations,
          categories: formData.categories,
          users: formData.users,
          incident: incident
        }} 
      />
    </div>
  );
}
