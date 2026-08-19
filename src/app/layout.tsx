import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Partner 360° · Itinerario de Automatización y Digitalización",
  description:
    "Gestión de partners tecnológicos para el Itinerario de Automatización y Digitalización: evaluación periódica 360º de desempeño, relación, valor de negocio, innovación y riesgo.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-page text-text-primary">{children}</body>
    </html>
  );
}
