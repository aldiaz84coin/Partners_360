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
          <span className="badge mb-3" style={{ background: "#184f951a", color: "var(--brand)" }}>
            Itinerario de Automatización y Digitalización
          </span>
          <h1 className="text-2xl font-semibold text-text-primary">Partner 360°</h1>
          <p className="text-sm text-text-secondary mt-1">
            Gestión de partners tecnológicos: evaluación periódica de desempeño, relación,
            valor de negocio, innovación y riesgo.
          </p>
        </div>
        <div className="card p-6">
          <LoginForm next={next} />
        </div>
      </div>
    </div>
  );
}
