import type { AppRole } from "@/types/auth";

export interface AppUser {
  id: string;
  email: string;
  role: AppRole;
  active: boolean;
  createdAt: string; // ISO datetime
}
