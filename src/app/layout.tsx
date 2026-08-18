import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Partner 360°",
  description: "Evaluación y gestión de la relación con partners tecnológicos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-page text-text-primary">{children}</body>
    </html>
  );
}
