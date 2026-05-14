import { prisma } from "@/lib/prisma";
import { checkAuth } from "@/lib/auth-utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  Briefcase, 
  Users, 
  ChevronRight,
  Shield,
  Activity as ActivityIcon,
  Lock,
  Clock,
  Edit2,
  Calendar,
  KeyRound
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default async function ProfilePage() {
  const session = await checkAuth();
  const userId = (session.user as any).id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      company: true,
      department: true,
      designation: true,
      location: true,
      superior: true,
    }
  });

  if (!user) return null;

  const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50/50 p-8 space-y-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between px-1">
          <h1 className="text-xl font-bold text-slate-800">My Profile</h1>
          <Link href="/profile/change-password">
            <Button variant="outline" size="sm" className="h-9 gap-2 text-xs font-bold rounded-xl border-slate-200 text-[#0176D3] bg-white shadow-sm hover:bg-slate-50">
              <KeyRound className="size-3.5" />
              Update Password
            </Button>
          </Link>
        </div>

        {/* PROFILE OVERVIEW CARD */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="bg-slate-100/80 p-10 flex items-center gap-8 border-b">
            <Avatar className="size-28 rounded-none border-4 border-white shadow-md">
              <AvatarFallback className="text-3xl font-black rounded-none bg-[#0176D3] text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{user.name}</h2>
                <span className="px-3 py-1 bg-white/50 border border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest rounded-full">
                  {user.role}
                </span>
              </div>
              <p className="text-sm font-bold text-[#0176D3] uppercase tracking-[0.15em]">
                {user.designation?.title || "Staff Professional"}
              </p>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <MapPin className="size-4 text-slate-400" />
                <span>{user.location?.name || "Corporate HQ"}, {user.company.name}</span>
              </div>
            </div>
          </div>
          
          <div className="px-10 py-6 grid grid-cols-3 divide-x border-b">
             <div className="text-center px-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Company</p>
                <p className="text-sm font-bold text-slate-700">{user.company.name}</p>
             </div>
             <div className="text-center px-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Department</p>
                <p className="text-sm font-bold text-slate-700">{user.department?.name || "Operations"}</p>
             </div>
             <div className="text-center px-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">ID</p>
                <p className="text-sm font-bold text-slate-700">QT-{user.id.substring(0, 6).toUpperCase()}</p>
             </div>
          </div>
        </div>

        {/* EMPLOYMENT & REPORTING GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* EMPLOYMENT CARD */}
          <div className="bg-white rounded-2xl shadow-sm border p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b">
              <h3 className="text-lg font-bold text-slate-800">Employment</h3>
              <Edit2 className="size-4 text-slate-300" />
            </div>
            <div className="space-y-4">
               <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-slate-400 font-medium">System Role</span>
                  <span className="text-sm font-bold text-slate-700">{user.role}</span>
               </div>
               <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-slate-400 font-medium">Designation</span>
                  <span className="text-sm font-bold text-slate-700">{user.designation?.title || "-"}</span>
               </div>
               <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-slate-400 font-medium">Member Since</span>
                  <span className="text-sm font-bold text-slate-700">{user.createdAt.toLocaleDateString()}</span>
               </div>
            </div>
          </div>

          {/* REPORTING & CONTACT CARD */}
          <div className="bg-white rounded-2xl shadow-sm border p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b">
              <h3 className="text-lg font-bold text-slate-800">Reporting & Contact</h3>
              <Users className="size-4 text-slate-300" />
            </div>
            <div className="space-y-4">
               <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-slate-400 font-medium">Direct Superior</span>
                  <span className="text-sm font-bold text-slate-700">{user.superior?.name || "None"}</span>
               </div>
               <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-slate-400 font-medium">Email Address</span>
                  <span className="text-sm font-bold text-slate-700">{user.email}</span>
               </div>
               <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-slate-400 font-medium">Phone Number</span>
                  <span className="text-sm font-bold text-slate-700">{user.phone || "Not Provided"}</span>
               </div>
            </div>
          </div>
        </div>

        {/* ACCOUNT SECURITY FOOTER */}
        <div className="p-8 border border-dashed rounded-2xl flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-4">
             <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center">
                <Shield className="size-5 text-slate-400" />
             </div>
             <div>
                <p className="text-sm font-bold text-slate-800">Account Security</p>
                <p className="text-xs text-slate-400">Regularly updating your password ensures your access remains secure.</p>
             </div>
          </div>
          <Link href="/profile/change-password">
             <Button variant="ghost" className="text-xs font-bold text-[#0176D3] uppercase tracking-widest gap-2">
                Manage Security
                <ChevronRight className="size-4" />
             </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
