"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateIncident } from "@/app/actions/incidents";
import { toast } from "sonner";
import { Loader2, Save, ChevronLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Editor } from "@/components/ui/editor";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  priority: z.string(),
});

export function EditIncidentForm({ incident }: { incident: any }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: incident.title,
      description: incident.description,
      priority: incident.priority,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      await updateIncident(incident.id, values);
      toast.success("Incident updated");
      router.push(`/incidents/${incident.id}`);
      router.refresh();
    } catch (error) {
      toast.error("Failed to update incident");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-6 border-b">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="size-8 rounded-sm border bg-white hover:bg-muted/50 transition-all">
            <Link href={`/incidents/${incident.id}`}>
              <ChevronLeft className="size-4 text-muted-foreground" />
            </Link>
          </Button>
          <div className="space-y-0.5">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Modify Incident</h2>
            <p className="text-[10px] font-bold text-[#0176D3] uppercase tracking-wider">{incident.ticketId}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <Button variant="ghost" asChild className="h-8 px-4 text-xs font-semibold text-muted-foreground hover:text-foreground">
              <Link href={`/incidents/${incident.id}`}>Cancel</Link>
           </Button>
           <Button 
             onClick={form.handleSubmit(onSubmit)}
             disabled={isSubmitting}
             className="h-8 px-6 font-bold text-xs bg-[#0176D3] hover:bg-[#014486] text-white transition-all"
           >
             {isSubmitting ? <Loader2 className="size-3 animate-spin mr-2" /> : <Save className="mr-2 size-3.5" />}
             Save Changes
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border shadow-none rounded-sm">
            <CardHeader className="p-4 border-b bg-muted/5">
              <CardTitle className="text-sm font-bold">Primary Information</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Form {...form}>
                <form className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs font-medium text-muted-foreground">Title</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            className="h-9 bg-transparent border-b border-t-0 border-x-0 rounded-none font-semibold text-sm focus-visible:ring-0 focus-visible:border-[#0176D3] transition-all"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs font-medium text-muted-foreground">Description</FormLabel>
                        <FormControl>
                          <Editor 
                            content={field.value} 
                            onChange={field.onChange} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border shadow-none rounded-sm">
            <CardHeader className="p-4 border-b bg-muted/5">
              <CardTitle className="text-sm font-bold">Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs font-medium text-muted-foreground">Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9 bg-transparent border-b border-t-0 border-x-0 rounded-none font-semibold text-sm focus:ring-0 focus:border-[#0176D3] transition-all px-0">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-none border shadow-lg">
                        <SelectItem value="LOW" className="text-sm">Low</SelectItem>
                        <SelectItem value="MEDIUM" className="text-sm">Medium</SelectItem>
                        <SelectItem value="HIGH" className="text-sm">High</SelectItem>
                        <SelectItem value="CRITICAL" className="text-sm">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <div className="p-4 bg-muted/5 border rounded-sm space-y-2">
             <div className="flex items-center gap-2">
                <ShieldAlert className="size-3.5 text-muted-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Audit Log</span>
             </div>
             <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">
                All modifications to this record are tracked and timestamped for compliance.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}


