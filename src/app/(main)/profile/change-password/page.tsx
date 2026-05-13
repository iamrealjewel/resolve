import { checkAuth } from "@/lib/auth-utils";
import { ProfileClient } from "../profile-client";
import { ShieldCheck, ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ChangePasswordPage() {
  await checkAuth();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-slate-50/50">
      <div className="w-full max-w-xl space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/profile">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white shadow-sm border border-transparent hover:border-slate-200">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-slate-800">Security Update</h1>
            <p className="text-xs font-medium text-slate-400">Update your account authentication key</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-12 space-y-10">
          <div className="flex items-center gap-3 pb-8 border-b">
             <div className="size-10 rounded-xl bg-[#0176D3]/10 flex items-center justify-center">
                <Lock className="size-5 text-[#0176D3]" />
             </div>
             <div>
                <h2 className="text-lg font-bold text-slate-800">Change Password</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Protect your workspace access</p>
             </div>
          </div>

          <ProfileClient />
        </div>
        
        <p className="text-center text-[10px] font-medium text-slate-400 uppercase tracking-widest">
           Your security is our priority. Ensure your password is strong.
        </p>
      </div>
    </div>
  );
}
