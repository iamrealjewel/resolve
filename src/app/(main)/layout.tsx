import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ClientLayout } from "./client-layout";
import { AuthProvider } from "@/components/auth-provider";
import { LayoutProvider } from "@/components/layout-provider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <AuthProvider session={session}>
      <LayoutProvider>
        <ClientLayout>{children}</ClientLayout>
      </LayoutProvider>
    </AuthProvider>
  );
}
