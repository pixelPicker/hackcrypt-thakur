"use client";
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import * as React from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ConfidenceScoreProps = {
  label: "Authentic" | "Suspicious" | "Manipulated";
  confidence: number;
  riskLevel: "Low" | "Medium" | "High";
};

function riskVariant(riskLevel: ConfidenceScoreProps["riskLevel"]) {
  if (riskLevel === "High") return "danger" as const;
  if (riskLevel === "Medium") return "warning" as const;
  return "success" as const;
}

export function ConfidenceScore({
  label,
  confidence,
  riskLevel,
}: ConfidenceScoreProps) {
  const safeConfidence = Math.max(0, Math.min(100, confidence));

  return (
    <div className="space-y-2 flex justify-between flex-col items-center h-full">
      <div className="space-y-2">
        <p
          className={cn(
            "text-3xl font-semibold",
            label === "Authentic"
              ? "text-emerald-700"
              : label === "Suspicious"
              ? "text-yellow-700"
              : "text-red-700"
          )}
        >
          {label}
        </p>
        <div>
          <Badge variant={riskVariant(riskLevel)} className="mt-1 text-xs">
            Risk: {riskLevel}
          </Badge>
        </div>
      </div>

      <ConfidenceRadial value={safeConfidence} />
    </div>
  );
}

function ConfidenceRadial({ value }: { value: number }) {
  const data = [{ name: "confidence", value }];

  return (
    <div className="relative w-65 h-65 mx-auto">
      <RadialBarChart
        width={260}
        height={260}
        innerRadius="70%"
        outerRadius="100%"
        data={data}
        startAngle={90}
        endAngle={-270}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
        <RadialBar
          dataKey="value"
          cornerRadius={10}
          fill="currentColor"
          className="text-primary"
        />
      </RadialBarChart>
      <div className="absolute top-1/2 left-1/2 -translate-1/2">
        <h2 className="font-semibold text-4xl">{value}%</h2>
      </div>
    </div>
  );
}