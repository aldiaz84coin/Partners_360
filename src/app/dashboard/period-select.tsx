"use client";

import { useRouter, usePathname } from "next/navigation";

type Period = { id: string; label: string; status: string };

export function PeriodSelect({ periods, selectedId }: { periods: Period[]; selectedId: string }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <select
      className="input w-auto"
      defaultValue={selectedId}
      onChange={(e) => router.push(`${pathname}?period=${e.target.value}`)}
    >
      {periods.map((p) => (
        <option key={p.id} value={p.id}>
          {p.label} {p.status === "OPEN" ? "(abierto)" : ""}
        </option>
      ))}
    </select>
  );
}
