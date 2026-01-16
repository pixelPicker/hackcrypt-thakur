"use client";

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
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    const controls = animate(count, safeConfidence, {
      duration: 1.5,
      ease: "easeOut",
    });

    const unsubscribe = rounded.on("change", (latest) => {
      setDisplayValue(latest);
    });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [safeConfidence, count, rounded]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">Verdict</div>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={cn(
              "text-xl font-semibold tracking-tight",
              label === "Authentic"
                ? "text-emerald-500"
                : label === "Suspicious"
                ? "text-yellow-500"
                : "text-red-500"
            )}
          >
            {label}
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          whileHover={{ scale: 1.05 }}
        >
          <Badge variant={riskVariant(riskLevel)} className="text-xs">
            {riskLevel === "High" && (
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="mr-1"
              >
                ⚠️
              </motion.span>
            )}
            Risk: {riskLevel}
          </Badge>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl border border-border/60 bg-card/40 p-4 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">Confidence</div>
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
            className="text-sm font-medium tabular-nums"
          >
            {displayValue.toFixed(1)}%
          </motion.div>
        </div>
        <motion.div
          className="mt-2"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          style={{ transformOrigin: "left" }}
        >
          <Progress value={safeConfidence} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
