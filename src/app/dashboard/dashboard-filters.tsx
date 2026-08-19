"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

type Period = { id: string; label: string; status: string };

const TECH_AREA_OPTIONS = [
  { value: "ALL", label: "Todas las áreas" },
  { value: "AUTOMATIZACION", label: "Automatización" },
  { value: "DIGITALIZACION", label: "Digitalización" },
];

export function DashboardFilters({
  periods,
  selectedPeriodId,
  selectedTechArea,
}: {
  periods: Period[];
  selectedPeriodId: string;
  selectedTechArea: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <select
        className="input w-auto"
        defaultValue={selectedTechArea}
        onChange={(e) => setParam("area", e.target.value)}
      >
        {TECH_AREA_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        className="input w-auto"
        defaultValue={selectedPeriodId}
        onChange={(e) => setParam("period", e.target.value)}
      >
        {periods.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label} {p.status === "OPEN" ? "(abierto)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
