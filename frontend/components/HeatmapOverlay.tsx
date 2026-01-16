"use client";

import * as React from "react";
import { motion } from "framer-motion";

import type { HeatmapBox } from "@/app/api";
import { cn } from "@/lib/utils";

export type HeatmapOverlayProps = {
  boxes?: HeatmapBox[];
  className?: string;
  children: React.ReactNode;
};

export function HeatmapOverlay({ boxes, className, children }: HeatmapOverlayProps) {
  return (
    <div className={cn("relative", className)}>
      {children}

      <div className="pointer-events-none absolute inset-0">
        {(boxes ?? []).map((b, idx) => {
          const left = `${b.x * 100}%`;
          const top = `${b.y * 100}%`;
          const width = `${b.w * 100}%`;
          const height = `${b.h * 100}%`;
          const alpha = Math.max(0.15, Math.min(0.65, b.intensity));

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: Math.min(0.4, idx * 0.03) }}
              className="absolute rounded-lg border"
              style={{
                left,
                top,
                width,
                height,
                borderColor: `rgba(239, 68, 68, ${alpha + 0.15})`,
                background: `rgba(239, 68, 68, ${alpha * 0.25})`,
                boxShadow: `0 0 0 1px rgba(239, 68, 68, ${alpha * 0.35}), 0 0 24px rgba(239, 68, 68, ${alpha * 0.2})`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
