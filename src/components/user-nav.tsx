"use client";

import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
            <AvatarImage src="/avatars/01.png" alt={`@${user?.name || "user"}`} />
            <AvatarFallback className="rounded-none">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 rounded-none shadow-none border" align="end" sideOffset={8}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-4 bg-muted/30">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-bold leading-none text-foreground">{user?.name || "User"}</p>
              <p className="text-[10px] font-medium leading-none text-muted-foreground uppercase tracking-wider mt-1">
                {user?.email || "user@example.com"}
              </p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="m-0" />
        <DropdownMenuGroup className="p-1">
          <DropdownMenuItem className="h-10">
            Profile
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem className="h-10">
            Settings
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="m-0" />
        <DropdownMenuGroup className="p-1">
          <DropdownMenuItem onClick={() => signOut()} className="h-10 text-destructive focus:bg-destructive/10 focus:text-destructive">
            Log out
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
