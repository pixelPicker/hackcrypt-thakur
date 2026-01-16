"use client";

import Link from "next/link";
import { ShieldCheck, Upload, Activity } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export function Navbar({ className }: { className?: string }) {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl",
        className
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" className="group flex items-center gap-2">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-card/60 backdrop-blur-sm transition-colors group-hover:border-primary/50"
          >
            <ShieldCheck className="h-5 w-5" />
          </motion.div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-wide text-foreground transition-colors">
              Deepfake Detection
            </div>
            <div className="text-xs text-muted-foreground">
              Media Authenticity Analyzer
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground transition-all hover:bg-secondary/60 hover:text-foreground hover:scale-105 active:scale-95"
          >
            <Upload className="h-4 w-4" />
            Upload
          </Link>
          <Link
            href="/results"
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground transition-all hover:bg-secondary/60 hover:text-foreground hover:scale-105 active:scale-95"
          >
            <Activity className="h-4 w-4" />
            Results
          </Link>
        </nav>
      </div>
    </motion.header>
  );
}
