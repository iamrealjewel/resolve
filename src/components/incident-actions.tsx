"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, MessageSquare } from "lucide-react";
import { approveIncident, updateIncidentStatus } from "@/app/actions/incidents";
import { toast } from "sonner";

interface IncidentActionsProps {
  incidentId: string;
  status: string;
  isApprover: boolean;
  isResolver: boolean;
}

export function IncidentActions({ incidentId, status, isApprover, isResolver }: IncidentActionsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleApprove() {
    setIsSubmitting(true);
    try {
      await approveIncident(incidentId, "Approved via quick action.");
      toast.success("DISPATCH APPROVED", {
        description: "The ticket parameters have been validated and released for resolution."
      });
    } catch (error) {
      toast.error("VALIDATION FAILURE");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResolve() {
    setIsSubmitting(true);
    try {
      await updateIncidentStatus(incidentId, "RESOLVED", "Issue fixed by resolver.");
      toast.success("DISPATCH RESOLVED", {
        description: "Resolution parameters have been committed to the registry."
      });
    } catch (error) {
      toast.error("COMMIT FAILURE");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" className="h-12 font-black uppercase tracking-[0.2em] border-2 rounded-none px-6">
        <MessageSquare className="mr-2 size-4 text-indigo-600" /> Append Log
      </Button>

      {(status === "PENDING_RAISER_APPROVAL" || status === "PENDING_RESOLVER_APPROVAL") && isApprover && (
        <Button 
          onClick={handleApprove} 
          disabled={isSubmitting}
          className="h-12 px-10 font-black uppercase tracking-[0.2em] bg-amber-600 hover:bg-amber-700 text-white rounded-none border-0 shadow-xl shadow-amber-600/20 transition-all"
        >
          {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : <CheckCircle2 className="mr-2 size-5" />}
          Validate Dispatch
        </Button>
      )}

      {(status === "NEW" || status === "ASSIGNED" || status === "IN_PROGRESS") && isResolver && (
        <Button 
          onClick={handleResolve} 
          disabled={isSubmitting}
          className="h-12 px-10 font-black uppercase tracking-[0.2em] bg-indigo-600 hover:bg-indigo-700 text-white rounded-none border-0 shadow-xl shadow-indigo-600/20 transition-all"
        >
          {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : <CheckCircle2 className="mr-2 size-5" />}
          Commit Resolution
        </Button>
      )}
    </div>
  );
}

