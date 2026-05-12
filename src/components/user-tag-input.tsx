"use client";

import * as React from "react";
import { X, Search, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
}

interface UserTagInputProps {
  users: User[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function UserTagInput({
  users,
  value,
  onChange,
  placeholder = "Tag users to notify...",
  disabled = false,
}: UserTagInputProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const selectedUsers = users.filter((u) => value.includes(u.id));
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleUser = (userId: string) => {
    const newValue = value.includes(userId)
      ? value.filter((id) => id !== userId)
      : [...value, userId];
    onChange(newValue);
  };

  const removeUser = (userId: string) => {
    onChange(value.filter((id) => id !== userId));
  };

  return (
    <div className={cn("space-y-3", selectedUsers.length === 0 && "space-y-0")}>
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map((user) => (
            <Badge
              key={user.id}
              variant="secondary"
              className="rounded-none h-7 px-2 flex items-center gap-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-all font-bold text-[10px] uppercase tracking-wider"
            >
              {user.name}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeUser(user.id)}
                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove</span>
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}
      
      <Popover open={open} onOpenChange={setOpen}>
        <FormControl>
          <PopoverTrigger
            disabled={disabled}
            aria-expanded={open}
            className="flex items-center h-14 w-full justify-between bg-muted/5 border border-muted-foreground/20 rounded-none px-5 text-xs font-bold focus:bg-background transition-all text-left"
          >
            {placeholder}
            {!disabled && <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
          </PopoverTrigger>
        </FormControl>
        <PopoverContent className="p-0 rounded-none border-muted-foreground/20 shadow-2xl" align="start">
          <div className="flex flex-col">
            <div className="p-3 border-b bg-muted/20">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search personnel directory..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 pl-10 bg-background border-muted-foreground/20 rounded-none text-xs font-medium focus-visible:ring-0"
                />
              </div>
            </div>
            <div className="max-h-[300px] overflow-y-auto p-1 bg-background">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  No personnel found
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const isSelected = value.includes(user.id);
                  return (
                    <Button
                      key={user.id}
                      variant="ghost"
                      className="w-full justify-start h-auto py-3 rounded-none border-b border-muted/30 last:border-0 group px-4"
                      onClick={() => toggleUser(user.id)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex flex-col items-start text-left gap-1">
                          <span className="text-xs font-bold text-foreground">
                            {user.name}
                          </span>
                          <div className="flex items-center gap-2">
                             <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                               {(user as any).department?.name || "No Dept"}
                             </span>
                             <div className="size-1 bg-muted-foreground/30 rounded-full" />
                             <span className="text-[9px] text-primary/70 font-bold uppercase tracking-widest">
                               {(user as any).designation?.title || "No Desig"}
                             </span>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </Button>
                  );
                })
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
