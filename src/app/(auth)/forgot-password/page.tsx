"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Loader2, ArrowLeft, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        setSubmitted(true);
        toast.success("Reset link sent!");
      } else {
        toast.error("Error", {
          description: "Something went wrong. Please try again.",
        });
      }
    } catch (error) {
      toast.error("Connection error");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] p-4">
        <div className="mb-8 animate-in fade-in zoom-in duration-700">
          <img src="/logo.png" alt="Resolve Logo" className="h-12 w-auto" />
        </div>
        <Card className="w-full max-w-[400px] border-none shadow-[0_8px_30px_rgb(0,0,0,0.08)] bg-white rounded-xl text-center overflow-hidden">
          <div className="h-1.5 bg-[#0176D3]" />
          <CardHeader className="pt-8 px-8">
            <div className="h-14 w-14 rounded-full bg-[#0176D3]/10 flex items-center justify-center text-[#0176D3] mx-auto mb-4">
              <MailCheck className="h-7 w-7" />
            </div>
            <CardTitle className="text-xl font-bold text-[#1A1A1A]">Check your inbox</CardTitle>
            <CardDescription className="text-sm text-muted-foreground pt-2">
              We&apos;ve sent a secure password reset link to your email address. Please check your spam folder if you don&apos;t see it within a few minutes.
            </CardDescription>
          </CardHeader>
          <CardFooter className="pb-8 px-8">
            <Button variant="outline" className="w-full h-11 border-muted-foreground/20 text-muted-foreground hover:text-[#0176D3] hover:border-[#0176D3] transition-all rounded-lg" asChild>
              <Link href="/login">Return to Sign In</Link>
            </Button>
          </CardFooter>
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
          <CardTitle className="text-2xl font-bold text-[#1A1A1A]">Forgot Password?</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            No worries! Enter your professional email below and we&apos;ll help you get back in.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 px-8 pt-4 pb-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Work Email Address</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="e.g. employee@company.com" 
                required 
                className="h-12 bg-[#F3F4F6] border-transparent focus:bg-white focus:border-[#0176D3] focus:ring-0 transition-all rounded-lg text-sm"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 px-8 pb-8">
            <Button className="w-full h-12 bg-[#0176D3] hover:bg-[#014486] text-white font-bold text-sm shadow-lg shadow-[#0176D3]/20 transition-all rounded-lg" type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Send Reset Link
            </Button>
            
            <Link href="/login" className="flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground hover:text-[#0176D3] transition-colors mt-2">
              <ArrowLeft className="h-3 w-3" />
              Back to Sign In
            </Link>
          </CardFooter>
        </form>
      </Card>
      
      <p className="mt-8 text-xs text-muted-foreground/60 font-medium">
        &copy; 2026 Resolve Incident Management. All rights reserved.
      </p>
    </div>
  );
}
