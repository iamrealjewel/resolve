"use client";

import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Edit2, Loader2, UserCircle2 } from "lucide-react";
import { uploadFile } from "@/app/actions/incidents";
import { updateProfile } from "@/app/actions/master";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export function ProfilePhotoEditor({ initialImage, initials }: { initialImage: string | null, initials: string }) {
  const [image, setImage] = useState(initialImage);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const { update } = useSession();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "avatars");
      
      const result = await uploadFile(formData);
      
      if (result?.url) {
        await updateProfile({ image: result.url });
        setImage(result.url);
        
        // Update client-side session
        await update({ image: result.url });
        
        toast.success("Profile photo updated");
        router.refresh();
      }
    } catch (error) {
      toast.error("Photo update failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative group">
      <Avatar className="size-28 rounded-full border-4 border-white shadow-md overflow-hidden">
        <AvatarImage src={image || "/avatars/default.png"} className="object-cover" />
        <AvatarFallback className="text-3xl font-black rounded-full bg-[#0176D3] text-white">
          {uploading ? <Loader2 className="size-8 animate-spin" /> : initials}
        </AvatarFallback>
      </Avatar>
      <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
        <Edit2 className="size-6" />
        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploading} />
      </label>
    </div>
  );
}
