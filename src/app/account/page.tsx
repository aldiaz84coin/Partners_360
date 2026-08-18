import { requireUser } from "@/lib/auth";
import { AppNav } from "@/components/nav";
import { PageHeader, Card } from "@/components/ui";
import { ChangePasswordForm } from "./change-password-form";

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <div className="flex flex-col flex-1">
      <AppNav user={user} />
      <main className="max-w-2xl w-full mx-auto px-4 sm:px-6 py-8 flex-1">
        <PageHeader title="Mi cuenta" subtitle={user.email} />
        <Card>
          <h2 className="font-medium text-text-primary mb-4">Cambiar contraseña</h2>
          <ChangePasswordForm />
        </Card>
      </main>
    </div>
  );
}
