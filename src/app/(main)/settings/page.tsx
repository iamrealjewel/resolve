import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Shield, Bell } from "lucide-react";
import { checkAuth } from "@/lib/auth-utils";

export default async function SettingsPage() {
  await checkAuth(["SUPER_ADMIN", "DEPARTMENT_HEAD"]);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">System Preferences</h2>
        <p className="text-muted-foreground font-medium">
          Manage your personal configuration and notification settings.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border shadow-none rounded-none">
          <CardHeader className="p-6 bg-muted/20 border-b">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <User className="size-5 text-primary" /> Profile Settings
            </CardTitle>
            <CardDescription className="text-xs font-medium">Update your display name and contact details.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex items-center justify-center h-32 text-muted-foreground text-sm font-bold uppercase tracking-widest">
            Configuration Module Offline
          </CardContent>
        </Card>

        <Card className="border shadow-none rounded-none">
          <CardHeader className="p-6 bg-muted/20 border-b">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Shield className="size-5 text-primary" /> Security Options
            </CardTitle>
            <CardDescription className="text-xs font-medium">Manage multi-factor authentication and passwords.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex items-center justify-center h-32 text-muted-foreground text-sm font-bold uppercase tracking-widest">
            Configuration Module Offline
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
