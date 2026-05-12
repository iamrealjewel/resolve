"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        setSuccess(true);
        toast.success("Password reset successful");
        setTimeout(() => router.push("/login"), 3000);
      } else {
        const data = await response.json();
        toast.error(data.message || "Something went wrong");
      }
    } catch (error) {
      toast.error("Connection error");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <Card className="w-full max-w-md border-none shadow-2xl bg-card/70 backdrop-blur-md text-center p-8">
         <CardTitle className="text-red-500">Missing Token</CardTitle>
         <CardDescription className="mt-2">This reset link is invalid or has expired.</CardDescription>
         <Button variant="outline" className="mt-6 w-full" asChild>
            <Link href="/forgot-password">Request new link</Link>
         </Button>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="w-full max-w-md border-none shadow-2xl bg-card/70 backdrop-blur-md text-center p-8">
         <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 mx-auto mb-4">
            <ShieldCheck className="h-8 w-8" />
         </div>
         <CardTitle>Success!</CardTitle>
         <CardDescription className="mt-2">Your password has been reset. Redirecting to login...</CardDescription>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-none shadow-2xl bg-card/70 backdrop-blur-md relative z-10">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
        <CardDescription>
          Choose a strong password for your account.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input 
              id="password" 
              name="password" 
              type="password" 
              placeholder="••••••••" 
              required 
              className="bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input 
              id="confirmPassword" 
              name="confirmPassword" 
              type="password" 
              placeholder="••••••••" 
              required 
              className="bg-background/50"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full h-11" type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Reset Password
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 relative overflow-hidden">
      <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
