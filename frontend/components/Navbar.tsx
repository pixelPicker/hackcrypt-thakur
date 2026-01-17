"use client";

import Link from "next/link";
import { ShieldCheck, Upload, Activity, Menu, X, User } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";

export function Navbar({ className }: { className?: string }) {
  const [menuState, setMenuState] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { data: session } = useSession();
  const initial = (session?.user?.name || session?.user?.email || "?")
    .charAt(0)
    .toUpperCase();
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed w-full top-0 z-50 px-4 border-b border-white/5 bg-background/60 backdrop-blur-xl supports-backdrop-filter:bg-background/60",
        className,
      )}
    >
      <div className="mx-auto flex w-full md:max-w-7xl items-center justify-between md:p-5 py-3 px-1">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-tr from-blue-500/20 to-purple-500/20 border border-white/10 group-hover:border-blue-500/50 transition-colors duration-300">
            <ShieldCheck className="h-6 w-6 text-blue-400 group-hover:text-blue-300 transition-colors" />
            <div className="absolute inset-0 rounded-xl bg-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white group-hover:text-blue-200 transition-colors">
              Deepfake Detection
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground group-hover:text-blue-400/70 transition-colors">
              Media Authenticity Analyzer
            </span>
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
          {session?.user && (
            <div className="relative ml-2 pl-3 border-l border-border/60 flex items-center">
              <button
                type="button"
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center justify-center h-8 w-8 cursor-pointer rounded-full bg-white/10 border border-white/30 text-white"
                aria-label="Profile menu"
              >
                <span className="text-xs font-semibold">{initial}</span>
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-10 z-20 min-w-[140px] rounded-md border border-white/20 bg-black/90 p-1 shadow-xl">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="w-full cursor-pointer rounded-sm px-3 py-2 text-left text-sm text-white hover:bg-white/10"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
          {!session?.user && (
            <div className="ml-2 pl-3 border-l border-border/60">
              <Link href="/login">
                <Button className="h-8 px-3 bg-white text-black hover:bg-white/90">
                  Login
                </Button>
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile menu toggle */}
        <div className="lg:hidden z-50">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMenuState(!menuState)}
            className="relative z-50 text-white hover:bg-white/10"
          >
            <AnimatePresence mode="wait">
              {menuState ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="h-6 w-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="h-6 w-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {menuState && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="absolute top-full left-0 w-full overflow-hidden bg-background/95 backdrop-blur-3xl border-b border-white/10 shadow-2xl lg:hidden bg-gray-800"
            >
              <div className="flex flex-col items-start gap-1 p-2">
                <Link
                  href="/upload"
                  className="inline-flex w-full items-center gap-2 rounded-md px-3 py-2 text-muted-foreground transition-all hover:bg-secondary/60 hover:text-foreground"
                  onClick={() => setMenuState(false)}
                >
                  <Upload className="h-4 w-4" />
                  Upload
                </Link>

                <Link
                  href="/results"
                  className="inline-flex w-full items-center gap-2 rounded-md px-3 py-2 text-muted-foreground transition-all hover:bg-secondary/60 hover:text-foreground"
                  onClick={() => setMenuState(false)}
                >
                  <Activity className="h-4 w-4" />
                  Results
                </Link>

                {!session?.user && (
                  <Link
                    href="/login"
                    className="inline-flex w-full items-center gap-2 rounded-md px-3 py-2 text-muted-foreground transition-all hover:bg-secondary/60 hover:text-foreground"
                    onClick={() => setMenuState(false)}
                  >
                    <User className="h-4 w-4" />
                    Login
                  </Link>
                )}

                {session?.user && (
                  <button
                    onClick={() => {
                      setMenuState(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-white hover:bg-white/10 rounded-md border-t border-white/10 mt-1"
                  >
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white/10 border border-white/30">
                      <span className="text-xs font-semibold">{initial}</span>
                    </div>
                    <div className="text-xs">Logout</div>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
