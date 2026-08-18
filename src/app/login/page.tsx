import { redirect } from "next/navigation";
import { getCurrentUser, defaultDestination } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect(defaultDestination(user.systemRole));
  const { next } = await searchParams;

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-text-primary">Partner 360°</h1>
          <p className="text-sm text-text-secondary mt-1">
            Evaluación y gestión de la relación con partners tecnológicos.
          </p>
        </div>
        <div className="card p-6">
          <LoginForm next={next} />
        </div>
      </div>
    </div>
  );
}
