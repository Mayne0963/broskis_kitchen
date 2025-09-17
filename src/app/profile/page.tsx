"use client";

import { useAuth } from "@/lib/context/AuthContext";
import SessionGate from "@/components/auth/SessionGate";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";
import { storage, adminStorage } from "@/lib/services/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/services/firebase";
import { useRouter } from "next/navigation";

const profileSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, isLoading, isAdmin } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      email: "",
    },
  });

  useEffect(() => {
    if (user) {
      setValue("displayName", user.displayName || "");
      setValue("email", user.email || "");
      setAvatarUrl(user.photoURL || "");
    }
  }, [user, setValue]);

  const onSubmit = async (data: ProfileForm) => {
    if (!user) return;
    try {
      await updateProfile(user, { displayName: data.displayName });
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { displayName: data.displayName });
      alert("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const activeStorage = isAdmin ? adminStorage : storage;
      const storageRef = ref(activeStorage, `avatars/${user.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateProfile(user, { photoURL: url });
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { photoURL: url });
      setAvatarUrl(url);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  return (
    <SessionGate>
      <div className="min-h-screen bg-gradient-to-b from-black to-[#1A1A1A] text-white py-12 px-4">
        <div className="max-w-md mx-auto bg-[#1A1A1A] p-8 rounded-lg shadow-md border border-[var(--color-harvest-gold)]">
          <h1 className="text-3xl font-bold mb-6 text-center text-[var(--color-harvest-gold)]">User Profile</h1>
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={avatarUrl} alt="Profile picture" />
                <AvatarFallback>{user?.displayName?.[0] || user?.email?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <Label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-[var(--color-harvest-gold)] p-2 rounded-full cursor-pointer">
                <Camera className="w-4 h-4 text-black" />
                <Input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={uploading} />
              </Label>
            </div>
            {uploading && <p className="mt-2 text-sm">Uploading...</p>}
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="displayName">Name</Label>
              <Input id="displayName" {...register("displayName")} className="bg-[#2A2A2A] border-[var(--color-harvest-gold)]" />
              {errors.displayName && <p className="text-[var(--color-harvest-gold)] text-sm">{errors.displayName.message}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} className="bg-[#2A2A2A] border-[var(--color-harvest-gold)]" disabled />
              {errors.email && <p className="text-[var(--color-harvest-gold)] text-sm">{errors.email.message}</p>}
            </div>
            <Button type="submit" className="w-full bg-[var(--color-harvest-gold)] text-black">Update Profile</Button>
          </form>
          <Button onClick={logout} variant="destructive" className="w-full mt-4">Logout</Button>
        </div>
      </div>
    </SessionGate>
  );
}

