"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Mail, Lock, Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Image from "next/image";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid credentials. Please try again.");
      } else {
        toast.success("Welcome back!");
        router.push("/dashboard");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background selection:bg-primary/20">
      {/* Left Side - Microsoft Inspired Clean Sidebar */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden flex-col justify-between p-16">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.08),transparent_50%)]" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded bg-primary flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Resolve</h1>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-5xl font-bold tracking-tight text-white leading-tight">
            Streamlined Incident <br /> 
            <span className="text-slate-400">Response & Management</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-md font-medium">
            A centralized operational intelligence platform for high-resilience organizational workflows.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-6 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
          <span>Enterprise IMS v2.4</span>
          <span>•</span>
          <span>Secured Encryption</span>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Sign In</h2>
            <p className="text-muted-foreground font-medium">Enter your credentials to access the system.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Work Email</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="name@ispahanibd.com" 
                required 
                className="h-11 bg-background border-border focus:ring-2 focus:ring-primary/20 transition-all rounded-md shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Password</Label>
                <Link 
                  href="/forgot-password" 
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative group">
                <Input 
                  id="password" 
                  name="password" 
                  type={showPassword ? "text" : "password"}
                  required 
                  className="h-11 bg-background border-border focus:ring-2 focus:ring-primary/20 transition-all rounded-md shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button 
              className="w-full h-11 text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 shadow-sm transition-all rounded-md" 
              type="submit" 
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Sign In to Control Center
            </Button>
          </form>

          <div className="pt-8 flex flex-col items-center space-y-6 border-t">
            <p className="text-[11px] text-muted-foreground text-center font-medium leading-relaxed">
              Authorized personnel only. <br />
              All access attempts are logged and monitored.
            </p>
            <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="size-3" /> Back to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
