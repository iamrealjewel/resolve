"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Loader2 } from "lucide-react";
import { changeOwnPassword } from "@/app/actions/master";
import { toast } from "sonner";

export function ProfileClient() {
  const [isChanging, setIsChanging] = useState(false);
  const [passData, setPassData] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.new !== passData.confirm) {
      return toast.error("New passwords do not match");
    }
    if (passData.new.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    setIsChanging(true);
    try {
      await changeOwnPassword(passData.current, passData.new);
      toast.success("Password changed successfully");
      setPassData({ current: "", new: "", confirm: "" });
    } catch (error: any) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <form onSubmit={handlePasswordChange} className="space-y-6">
      <div className="space-y-2">
        <Label className="text-xs font-medium text-slate-400 uppercase tracking-widest">Current Password</Label>
        <Input 
          type="password" 
          required
          placeholder="••••••••"
          value={passData.current}
          onChange={(e) => setPassData({ ...passData, current: e.target.value })}
          className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#0176D3]/20 focus:border-[#0176D3] transition-all" 
        />
      </div>
      
      <div className="py-4">
        <div className="h-px bg-slate-100 w-full" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-slate-400 uppercase tracking-widest">New Password</Label>
          <Input 
            type="password" 
            required
            placeholder="••••••••"
            value={passData.new}
            onChange={(e) => setPassData({ ...passData, new: e.target.value })}
            className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#0176D3]/20 focus:border-[#0176D3] transition-all" 
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-slate-400 uppercase tracking-widest">Confirm New Password</Label>
          <Input 
            type="password" 
            required
            placeholder="••••••••"
            value={passData.confirm}
            onChange={(e) => setPassData({ ...passData, confirm: e.target.value })}
            className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#0176D3]/20 focus:border-[#0176D3] transition-all" 
          />
        </div>
      </div>

      <div className="pt-4">
        <Button 
          type="submit" 
          disabled={isChanging}
          className="w-full bg-[#0176D3] hover:bg-[#014486] text-white rounded-xl h-12 font-bold text-xs uppercase tracking-widest shadow-md shadow-[#0176D3]/20 transition-all"
        >
          {isChanging ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing Security Update...
            </>
          ) : (
            <>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Commit Security Update
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
