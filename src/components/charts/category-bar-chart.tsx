"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CATEGORY_COLORS } from "@/lib/chart-colors";

export type CategoryDatum = { code: string; name: string; score: number | null; weight: number };

export function CategoryBarChart({ data }: { data: CategoryDatum[] }) {
  const chartData = data.map((d) => ({ ...d, value: d.score === null ? 0 : Math.round(d.score) }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
        <CartesianGrid horizontal={false} stroke="var(--grid)" />
        <XAxis type="number" domain={[0, 100]} stroke="var(--text-muted)" fontSize={12} />
        <YAxis type="category" dataKey="name" width={150} stroke="var(--text-muted)" fontSize={12} />
        <Tooltip
          cursor={{ fill: "var(--surface-2)" }}
          contentStyle={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 13,
          }}
          formatter={(value, _name, item) =>
            item.payload.score === null ? ["Sin datos", ""] : [`${value} / 100`, "Puntuación"]
          }
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
          {chartData.map((d) => (
            <Cell key={d.code} fill={d.score === null ? "var(--grid)" : CATEGORY_COLORS[d.code]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
