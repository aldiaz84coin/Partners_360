import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
        {subtitle && <p className="text-sm text-text-secondary mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

const STATUS_COLORS: Record<string, { bg: string; fg: string; label: string }> = {
  good: { bg: "#0ca30c1a", fg: "var(--status-good)", label: "Excelente" },
  ok: { bg: "#2a78d61a", fg: "var(--brand)", label: "Bueno" },
  warning: { bg: "#fab2191a", fg: "#8a6100", label: "Adecuado" },
  serious: { bg: "#ec835a1a", fg: "#b34a24", label: "Deficiente" },
  critical: { bg: "#d03b3b1a", fg: "var(--status-critical)", label: "Muy deficiente" },
  none: { bg: "#89878114", fg: "var(--text-muted)", label: "Sin datos" },
};

export function scoreBand(score: number | null): keyof typeof STATUS_COLORS {
  if (score === null) return "none";
  if (score >= 85) return "good";
  if (score >= 65) return "ok";
  if (score >= 45) return "warning";
  if (score >= 25) return "serious";
  return "critical";
}

export function ScoreBadge({ score }: { score: number | null }) {
  const band = scoreBand(score);
  const c = STATUS_COLORS[band];
  return (
    <span className="badge" style={{ background: c.bg, color: c.fg }}>
      {score === null ? "Sin datos" : `${Math.round(score)} · ${c.label}`}
    </span>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "brand" }) {
  return (
    <span
      className="badge"
      style={
        tone === "brand"
          ? { background: "#184f951a", color: "var(--brand)" }
          : { background: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border)" }
      }
    >
      {children}
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="text-sm text-text-muted py-8 text-center">{children}</div>;
}
