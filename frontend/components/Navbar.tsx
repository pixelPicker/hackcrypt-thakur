"use client";

import Link from "next/link";
import { ShieldCheck, Upload, Activity, Menu, X } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { useState } from "react";
import { menu } from "framer-motion/client";

export function Navbar({ className }: { className?: string }) {
  const [menuState, setMenuState] = useState(false);
  return (
    <header
    
      className={cn(
        "fixed w-full top-0 z-50 px-4 border-b border-border/60 bg-background/70 backdrop-blur-xl",
        className
      )}
    >
      <div className="mx-auto flex w-full md:max-w-7xl  items-center justify-between md:p-5 py-3 px-1">
        <Link href="/" className="flex items-center gap-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-card/60">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="">
            <div className="md:text-xl text-sm font-semibold tracking-wide text-foreground">
              Deepfake Detection
            </div>
            <div className="text-xs  text-muted-foreground">
              Media Authenticity Analyzer
            </div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 text-sm">
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground transition-all hover:bg-secondary/60 hover:text-foreground hover:scale-105 active:scale-95"
          >
            <Upload className="md:h-4 md:w-4 h-3 w-3" />
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

        <Button
          onClick={() => setMenuState(!menuState)}
          className={`relative z-20 -mr-4 -mt-2 ${
            menuState ? "hidden" : "block"
          } cursor-pointer p-2.5 lg:hidden text-white bg-transparent`}
        >
          <Menu
            className={`${
              menuState
                ? "rotate-180 scale-0 opacity-0"
                : "rotate-0 scale-100 opacity-100"
            } m-auto size-6 duration-200`}
          />
        </Button>
        <Button
          onClick={() => setMenuState(!menuState)}
          className={`relative z-20 -mr-4 -mt-2 ${
            menuState ? "block" : "hidden"
          } cursor-pointer p-2.5 lg:hidden text-white bg-transparent`}
        >
          <X
            className={`${
              menuState
                ? "rotate-0 scale-100 opacity-100"
                : "rotate-180 scale-0 opacity-0"
            } m-auto size-6  duration-200`}
          />
        </Button>

        <nav
          className={`lg:hidden ${
            menuState ? "block" : "hidden"
          } fixed inset-0 z-10 mr-0 justify-start pt-16 gap-2 text-sm`}
        >
          <ul className="flex flex-col w-full h-screen bg-black">
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
          </ul>
        </nav>
      </div>
    </header>
  );
}
