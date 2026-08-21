"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

type Period = { id: string; label: string; status: string };
type Partner = { id: string; name: string };

const STATUS_OPTIONS = [
  { value: "ALL", label: "Todos los estados" },
  { value: "PENDING", label: "Pendiente" },
  { value: "DRAFT", label: "Borrador" },
  { value: "SUBMITTED", label: "Enviada" },
];

export function CampaignFilters({
  periods,
  partners,
  selectedPeriodId,
  selectedStatus,
  selectedPartnerId,
}: {
  periods: Period[];
  partners: Partner[];
  selectedPeriodId: string;
  selectedStatus: string;
  selectedPartnerId: string;
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
    <div className="flex flex-wrap items-center gap-2">
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
      <select
        className="input w-auto"
        defaultValue={selectedPartnerId}
        onChange={(e) => setParam("partner", e.target.value)}
      >
        <option value="ALL">Todos los partners</option>
        {partners.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <select
        className="input w-auto"
        defaultValue={selectedStatus}
        onChange={(e) => setParam("status", e.target.value)}
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
