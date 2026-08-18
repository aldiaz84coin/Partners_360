"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ROLE_COLORS, ROLE_LABEL } from "@/lib/chart-colors";

export type GapDatum = { role: string; score: number | null; count: number };

export function StakeholderGapChart({ data }: { data: GapDatum[] }) {
  const chartData = data.map((d) => ({
    ...d,
    label: ROLE_LABEL[d.role] ?? d.role,
    value: d.score === null ? 0 : Math.round(d.score),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ left: -12, right: 12, top: 8, bottom: 8 }}>
        <CartesianGrid vertical={false} stroke="var(--grid)" />
        <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={12} />
        <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={12} />
        <Tooltip
          cursor={{ fill: "var(--surface-2)" }}
          contentStyle={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 13,
          }}
          formatter={(value, _name, item) =>
            item.payload.score === null ? ["Sin respuestas", ""] : [`${value} / 100`, "Puntuación"]
          }
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {chartData.map((d) => (
            <Cell key={d.role} fill={d.score === null ? "var(--grid)" : ROLE_COLORS[d.role]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
