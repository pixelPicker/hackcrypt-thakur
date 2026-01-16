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

export function HeatmapOverlay({
  boxes,
  className,
  children,
}: HeatmapOverlayProps) {
  return (
    <div className={cn("relative", className)}>
      {children}

      <div className="pointer-events-none absolute inset-0">
        {(boxes ?? []).map((b, idx) => {
          const left = `${b.x * 100}%`;
          const top = `${b.y * 100}%`;
          const width = `${b.w * 100}%`;
          const height = `${b.h * 100}%`;

          // Dynamic color based on intensity
          let color = "16, 185, 129"; // Green (Safe)
          if (b.intensity > 0.7) {
            color = "239, 68, 68"; // Red (High Danger)
          } else if (b.intensity > 0.5) {
            color = "234, 179, 8"; // Yellow (Warning)
          }

          // Use intensity directly for opacity scaling to ensure visibility
          const bgOpacity = Math.max(0.1, b.intensity * 0.4);
          const borderOpacity = Math.max(0.4, b.intensity);

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: Math.min(0.4, idx * 0.03) }}
              className="absolute pointer-events-none"
              style={{
                left,
                top,
                width,
                height,
                outline: `2px solid rgba(${color}, ${borderOpacity})`,
                outlineOffset: "-2px",
                backgroundColor: `rgba(${color}, ${bgOpacity})`,
                boxShadow:
                  b.intensity > 0.6 ? `0 0 12px rgba(${color}, 0.5)` : "none",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
