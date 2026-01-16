"use client";

import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import type { TimelinePoint } from "@/app/api";

export type TimelineAnomaliesProps = {
  timeline?: TimelinePoint[];
};

type Datum = { t: number; score: number };

export function TimelineAnomalies({ timeline }: TimelineAnomaliesProps) {
  const data = React.useMemo<Datum[]>(() => {
    return (timeline ?? [])
      .map((p) => ({ t: p.t, score: Math.max(0, Math.min(1, p.score)) }))
      .sort((a, b) => a.t - b.t);
  }, [timeline]);

  return (
    <div className="min-h-56 w-full rounded-xl bg-neutral-700/40 p-6">
      <div className="mb-3 text-xl font-medium">
        Temporal anomaly confidence
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ left: 10, right: 10, top: 10, bottom: 0 }}
        >
          <CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} />
          <XAxis
            dataKey="t"
            tick={{ fill: "rgba(148,163,184,0.75)", fontSize: 12 }}
            axisLine={{ stroke: "rgba(148,163,184,0.25)" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 1]}
            tickFormatter={(v) => `${Math.round(v * 100)}%`}
            tick={{ fill: "rgba(148,163,184,0.75)", fontSize: 12 }}
            axisLine={{ stroke: "rgba(148,163,184,0.25)" }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(2, 6, 23, 0.85)",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              borderRadius: 12,
              color: "rgba(226, 232, 240, 0.95)",
            }}
            labelFormatter={(v) => `t = ${v}`}
            formatter={(v: any) => [
              `${Math.round(Number(v) * 100)}%`,
              "anomaly",
            ]}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="rgba(226, 232, 240, 0.9)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
