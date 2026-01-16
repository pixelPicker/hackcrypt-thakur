import Link from "next/link";
import { ShieldCheck, Upload, Activity } from "lucide-react";

import { cn } from "@/lib/utils";

export function Navbar({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur",
        className
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-card/60">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-wide text-foreground">
              Deepfake Detection
            </div>
            <div className="text-xs text-muted-foreground">Media Authenticity Analyzer</div>
          </div>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary/40 hover:text-foreground"
          >
            <Upload className="h-4 w-4" />
            Upload
          </Link>
          <Link
            href="/results"
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary/40 hover:text-foreground"
          >
            <Activity className="h-4 w-4" />
            Results
          </Link>
        </nav>
      </div>
    </header>
  );
}
