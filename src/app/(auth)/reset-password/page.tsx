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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] p-4">
        <div className="mb-10">
          <img src="/logo.png" alt="Resolve Logo" className="h-14 w-auto" />
        </div>
        <Card className="w-full max-w-[400px] border-none shadow-[0_8px_30px_rgb(0,0,0,0.08)] bg-white rounded-xl text-center overflow-hidden">
          <div className="h-1.5 bg-rose-500" />
          <CardHeader className="pt-8 px-8">
            <CardTitle className="text-xl font-bold text-rose-600 uppercase tracking-wider">Invalid Request</CardTitle>
            <CardDescription className="text-sm text-muted-foreground pt-2">
              The security token provided is either missing, invalid, or has expired. Please request a new link.
            </CardDescription>
          </CardHeader>
          <CardFooter className="pb-8 px-8">
            <Button variant="outline" className="w-full h-11 border-muted-foreground/20 text-muted-foreground hover:text-[#0176D3] hover:border-[#0176D3] transition-all rounded-lg font-bold text-xs uppercase tracking-widest" asChild>
              <Link href="/forgot-password">Request New Link</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] p-4">
        <div className="mb-10">
          <img src="/logo.png" alt="Resolve Logo" className="h-14 w-auto" />
        </div>
        <Card className="w-full max-w-[400px] border-none shadow-[0_8px_30px_rgb(0,0,0,0.08)] bg-white rounded-xl text-center overflow-hidden">
          <div className="h-1.5 bg-green-500" />
          <CardHeader className="pt-8 px-8 text-center">
            <div className="h-14 w-14 rounded-full bg-green-50 flex items-center justify-center text-green-600 mx-auto mb-4 border border-green-100">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <CardTitle className="text-xl font-bold text-[#1A1A1A]">Access Restored!</CardTitle>
            <CardDescription className="text-sm text-muted-foreground pt-2">
              Your password has been successfully reset. We are redirecting you to the sign-in portal.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8 flex justify-center">
            <Loader2 className="h-5 w-5 text-green-500 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] p-4 relative overflow-hidden">
      <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <img src="/logo.png" alt="Resolve Logo" className="h-14 w-auto" />
      </div>

      <Card className="w-full max-w-[400px] border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-white rounded-xl overflow-hidden relative z-10">
        <div className="h-1.5 bg-[#0176D3]" />
        <CardHeader className="space-y-1.5 pt-8 px-8 text-center">
          <CardTitle className="text-2xl font-bold text-[#1A1A1A]">Secure Reset</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Establish a strong, unique password for your Resolve account.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 px-8 pt-4 pb-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">New Secure Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="h-12 bg-[#F3F4F6] border-transparent focus:bg-white focus:border-[#0176D3] focus:ring-0 transition-all rounded-lg text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                required
                className="h-12 bg-[#F3F4F6] border-transparent focus:bg-white focus:border-[#0176D3] focus:ring-0 transition-all rounded-lg text-sm"
              />
            </div>
          </CardContent>
          <CardFooter className="px-8 pb-8">
            <Button className="w-full h-12 bg-[#0176D3] hover:bg-[#014486] text-white font-bold text-sm shadow-lg shadow-[#0176D3]/20 transition-all rounded-lg" type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update Password
            </Button>
          </CardFooter>
        </form>
      </Card>

      <p className="mt-8 text-xs text-muted-foreground/60 font-medium">
        &copy; 2026 Resolve Incident Management. Security Enforcement active.
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0176D3]" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
