"use client";

import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Key, LogOut } from "lucide-react";

export function UserNav() {
  const { data: session } = useSession();
  const user = session?.user;
  
  const initials = user?.name 
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-none p-0 border border-transparent hover:border-border transition-none">
          <Avatar className="h-full w-full">
            <AvatarFallback className="rounded-none">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 rounded-none shadow-xl border p-0" align="end" sideOffset={8}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-4 bg-muted/30 border-b">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-bold leading-none text-foreground">{user?.name || "User"}</p>
              <p className="text-[10px] font-medium leading-none text-muted-foreground uppercase tracking-wider mt-1">
                {user?.email || "user@example.com"}
              </p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        
        <DropdownMenuGroup className="p-1.5">
          <DropdownMenuItem asChild className="h-10 cursor-pointer focus:bg-[#0176D3]/10 focus:text-[#0176D3]">
            <Link href="/profile" className="flex items-center w-full">
              <User className="mr-3 size-4 opacity-70" />
              <span className="text-sm font-medium">View Profile</span>
              <DropdownMenuShortcut className="text-[10px] opacity-50">⇧⌘P</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="h-10 cursor-pointer focus:bg-[#0176D3]/10 focus:text-[#0176D3]">
            <Link href="/profile/change-password" className="flex items-center w-full">
              <Key className="mr-3 size-4 opacity-70" />
              <span className="text-sm font-medium">Change Password</span>
              <DropdownMenuShortcut className="text-[10px] opacity-50">⌘K</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator className="m-0" />
        
        <DropdownMenuGroup className="p-1.5">
          <DropdownMenuItem 
            onClick={() => signOut()} 
            className="h-10 text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer flex items-center w-full"
          >
            <LogOut className="mr-3 size-4 opacity-70" />
            <span className="text-sm font-bold">Log out</span>
            <DropdownMenuShortcut className="text-[10px] opacity-50">⇧⌘Q</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
