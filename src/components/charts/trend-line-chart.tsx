"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type TrendDatum = { label: string; score: number | null };

export function TrendLineChart({ data }: { data: TrendDatum[] }) {
  const chartData = data.map((d) => ({ ...d, value: d.score === null ? null : Math.round(d.score) }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ left: -12, right: 24, top: 8, bottom: 8 }}>
        <CartesianGrid vertical={false} stroke="var(--grid)" />
        <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={12} />
        <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={12} />
        <Tooltip
          contentStyle={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 13,
          }}
          formatter={(value) => (value === null || value === undefined ? ["Sin datos", ""] : [`${value} / 100`, "Puntuación"])}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#184f95"
          strokeWidth={2}
          dot={{ r: 4, fill: "#184f95" }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
