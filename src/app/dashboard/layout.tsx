import { requireUser } from "@/lib/auth";
import { AppNav } from "@/components/nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["ADMIN", "VIEWER"]);
  return (
    <div className="flex flex-col flex-1">
      <AppNav user={user} />
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex-1">{children}</main>
    </div>
  );
}
