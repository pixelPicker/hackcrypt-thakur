"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

type ModalityCardProps = {
  title: string;
  score: number;
  icon: React.ReactNode;
  details?: Record<string, any>;
  description?: string;
};

export function ModalityCard({
  title,
  score,
  icon,
  details,
  description,
}: ModalityCardProps) {
  const [expanded, setExpanded] = React.useState(false);

  const scorePercent = score * 100;
  const riskLevel = score > 0.7 ? "High" : score > 0.4 ? "Medium" : "Low";

  const getRiskVariant = (level: string) => {
    if (level === "High") return "danger" as const;
    if (level === "Medium") return "warning" as const;
    return "success" as const;
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader
        className="cursor-pointer hover:bg-accent/30 transition-colors pb-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-primary">{icon}</div>
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={getRiskVariant(riskLevel)} className="text-xs px-2">
              {scorePercent.toFixed(1)}%
            </Badge>
            {details && Object.keys(details).length > 0 && (
              <motion.div
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown size={18} className="text-muted-foreground" />
              </motion.div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Progress value={scorePercent} className="mb-3 h-2" />

        {description && (
          <p className="text-xs text-muted-foreground mb-3">{description}</p>
        )}

        {expanded && details && Object.keys(details).length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2 pt-3 border-t border-border/50"
          >
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Detailed Metrics
            </div>
            {Object.entries(details).map(([key, value]) => (
              <div key={key} className="flex justify-between text-xs py-1">
                <span className="text-muted-foreground capitalize">
                  {key
                    .replace(/_/g, " ")
                    .replace(/([A-Z])/g, " $1")
                    .trim()}
                  :
                </span>
                <span className="font-medium text-foreground">
                  {typeof value === "number"
                    ? value.toFixed(3)
                    : typeof value === "boolean"
                    ? value
                      ? "Yes"
                      : "No"
                    : String(value)}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
