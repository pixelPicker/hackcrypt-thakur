"use client";

import { motion } from "framer-motion";

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  return (
    <div className="relative 

">
      {/* Animated background gradients */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.12, 0.18, 0.12],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute left-[10%] top-[10%] h-96 w-96 rounded-full bg-blue-500/20 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute right-[15%] top-[20%] h-96 w-96 rounded-full bg-red-500/20 blur-3xl"
        /> */}
        {/* <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute bottom-[10%] left-[50%] h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl"
        /> */}
      </div>

      <main className="mx-auto w-full max-w-7xl px-5  h-screen max-h-screen ">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center max-h-screen h-screen">
          <section className="space-y-6 mt-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1 text-xs text-muted-foreground">
              Forensic UI • Real-time confidence • Media preview
            </div>
            <h1 className="text-6xl font-semibold tracking-tight">
              Deepfake Detection and Media Authenticity Analyzer
            </h1>

            <motion.p
              variants={itemVariants}
              className="max-w-xl text-sm leading-6 text-muted-foreground"
            >
              Upload a single image, video, or audio file and receive an
              authenticity verdict, confidence score, and risk level. Results
              are rendered with forensic widgets for rapid review.
            </motion.p>

            <div className="flex flex-wrap items-center gap-6">
              <a
                href="/upload"
                className="relative inline-flex h-10 items-center justify-center rounded-full px-8 py-6  font-medium text-primary-foreground bg-primary overflow-hidden
  transition-all duration-300
 bg-gradient-to-br from-blue-900/50 via-indigo-800/50 to-purple-900/50

  shadow-[0_0_10px_rgba(99,102,241,0.5)]
  
  before:absolute before:inset-0 before:rounded-full
 border-1 border-white/50
  before:opacity-75  before:animate-glow
  before:-z-10"
              >
                Start Analysis
              </a>

              <a
                href="/results"
                className="relative inline-flex h-10 items-center justify-center rounded-full px-8 py-6  font-medium text-primary-foreground bg-primary overflow-hidden
  transition-all duration-300
 
  shadow-[0_0_10px_rgba(99,102,241,0.5)]
  
  before:absolute before:inset-0 before:rounded-full
 
  before:opacity-75  before:animate-glow
  before:-z-10"
              >
                View Last Result
              </a>
            </div>
          </section>

              <section className="rounded-2xl  h-full w-124  ">
            <div className="image absolute right-8    bottom-3 h-120 ">
              <img className="w-140" src="/main.png"
              ></img>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
