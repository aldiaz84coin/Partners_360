import { redirect } from "next/navigation";
import { Handshake, Route } from "lucide-react";
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
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: "#184f951a" }}
          >
            <Handshake className="h-6 w-6" style={{ color: "var(--brand)" }} aria-hidden />
          </div>
          <span className="badge mb-3" style={{ background: "#184f951a", color: "var(--brand)" }}>
            <Route className="h-3.5 w-3.5" aria-hidden />
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
