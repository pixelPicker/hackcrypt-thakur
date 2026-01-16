"use client";

import Link from "next/link";
import { ShieldCheck, Upload, Activity } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export function Navbar({ className }: { className?: string }) {
  return (
    <header
      
      className={cn(
        "fixed w-full top-0 z-50 border-b border-gray-400/60 bg-background/80 backdrop-blur",
        className
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-card/60">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-xl font-semibold tracking-wide text-foreground">
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
    </header>
  );
}
