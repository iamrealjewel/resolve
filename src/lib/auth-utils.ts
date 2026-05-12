import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function checkAuth(requiredRole?: string | string[]) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Unauthorized: You must be logged in to perform this action.");
  }
  
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes((session.user as any).role)) {
      throw new Error("Forbidden: You do not have permission to perform this action.");
    }
  }
  
  return session;
}
