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
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md border-none shadow-2xl bg-card/70 backdrop-blur-md text-center">
          <CardHeader>
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 mx-auto mb-4">
              <MailCheck className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
            <CardDescription>
              We&apos;ve sent a password reset link to your email address.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/login">Return to Sign In</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 relative overflow-hidden">
      <Card className="w-full max-w-md border-none shadow-2xl bg-card/70 backdrop-blur-md relative z-10">
        <CardHeader className="space-y-1">
          <Button variant="ghost" className="w-fit -ml-4 mb-2 h-8 px-2" asChild>
            <Link href="/login">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Link>
          </Button>
          <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
          <CardDescription>
            Enter your email and we&apos;ll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="name@company.com" 
                required 
                className="bg-background/50"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full h-11" type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Send Reset Link
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
