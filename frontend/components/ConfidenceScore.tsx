"use client";

import * as React from "react";
import { motion } from "framer-motion";

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export type ConfidenceScoreProps = {
  label: "Authentic" | "Manipulated";
  confidence: number;
  riskLevel: "Low" | "Medium" | "High";
};

function riskVariant(riskLevel: ConfidenceScoreProps["riskLevel"]) {
  if (riskLevel === "High") return "danger" as const;
  if (riskLevel === "Medium") return "warning" as const;
  return "success" as const;
}

export function ConfidenceScore({ label, confidence, riskLevel }: ConfidenceScoreProps) {
  const safeConfidence = Math.max(0, Math.min(100, confidence));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">Verdict</div>
          <div className="text-xl font-semibold tracking-tight">{label}</div>
        </div>
        <Badge variant={riskVariant(riskLevel)} className="text-xs">
          Risk: {riskLevel}
        </Badge>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/40 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">Confidence</div>
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-medium tabular-nums"
          >
            {safeConfidence.toFixed(1)}%
          </motion.div>
        </div>
        <div className="mt-2">
          <Progress value={safeConfidence} />
        </div>
      </div>
    </div>
  );
}
