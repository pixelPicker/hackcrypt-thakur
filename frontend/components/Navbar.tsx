"use client";

import Link from "next/link";
import { ShieldCheck, Upload, Activity, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

export function Navbar({ className }: { className?: string }) {
  const [menuState, setMenuState] = useState(false);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed w-full top-0 z-50 px-4 border-b border-white/5 bg-background/60 backdrop-blur-xl supports-backdrop-filter:bg-background/60",
        className
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

        <nav className="hidden lg:flex items-center gap-1">
          {[
            { href: "/upload", label: "Upload", icon: Upload },
            { href: "/results", label: "Results", icon: Activity },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground transition-all hover:text-white hover:bg-white/5 group overflow-hidden"
            >
              <div className="absolute inset-0 bg-linear-gradient-to-tr from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-2 relative z-10">
                <link.icon className="h-4 w-4" />
                {link.label}
              </div>
            </Link>
          ))}
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
              className="absolute top-full left-0 w-full overflow-hidden bg-background/95 backdrop-blur-3xl border-b border-white/10 shadow-2xl lg:hidden"
            >
              <nav className="flex flex-col p-4 gap-2">
                {[
                  { href: "/upload", label: "Upload", icon: Upload },
                  { href: "/results", label: "Results", icon: Activity },
                ].map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMenuState(false)}
                      className="flex items-center gap-3 p-3 rounded-xl text-muted-foreground hover:text-white hover:bg-white/5 transition-all active:scale-98"
                    >
                      <div className="p-2 rounded-lg bg-white/5">
                        <link.icon className="h-5 w-5" />
                      </div>
                      <span className="font-medium text-lg">{link.label}</span>
                    </Link>
                  </motion.div>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
