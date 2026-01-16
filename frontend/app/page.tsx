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
    <div className="relative">
      {/* Animated background gradients */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
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
        />
        <motion.div
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
        />
      </div>

      <main className="relative mx-auto w-full max-w-6xl px-5 py-14">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center"
        >
          <section className="space-y-6">
            <motion.div variants={itemVariants}>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
                Forensic UI • Real-time confidence • Media preview
              </div>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-4xl font-semibold tracking-tight"
            >
              Deepfake Detection and Media Authenticity Analyzer
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="max-w-xl text-sm leading-6 text-muted-foreground"
            >
              Upload a single image, video, or audio file and receive an
              authenticity verdict, confidence score, and risk level. Results
              are rendered with forensic widgets for rapid review.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center gap-3"
            >
              <motion.a
                href="/upload"
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 10px 30px rgba(102, 126, 234, 0.3)",
                }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90"
              >
                Start Analysis
              </motion.a>
              <motion.a
                href="/results"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-transparent px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                View Last Result
              </motion.a>
            </motion.div>
          </section>

          <motion.section
            variants={cardVariants}
            whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)" }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm"
          >
            <div className="text-sm font-medium">Core outputs</div>
            <motion.div
              variants={containerVariants}
              className="mt-4 grid gap-3"
            >
              {[
                { label: "Label", value: "Authentic / Manipulated" },
                { label: "Confidence", value: "0–100%" },
                { label: "Risk level", value: "Low / Medium / High" },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  variants={itemVariants}
                  whileHover={{
                    scale: 1.02,
                    borderColor: "hsl(var(--primary))",
                  }}
                  className="rounded-xl border border-border/60 bg-background/20 p-4 transition-all"
                >
                  <div className="text-xs text-muted-foreground">
                    {item.label}
                  </div>
                  <div className="mt-1 text-base font-semibold">
                    {item.value}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.section>
        </motion.div>
      </main>
    </div>
  );
}
