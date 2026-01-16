"use client";

import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[url('/bg.jpg')] bg-cover bg-center bg-no-repeat">

      {/* DARK OVERLAY */}
      <div className="absolute inset-0 bg-black/60 pointer-events-none"></div>

      {/* MAIN CONTENT */}
      <main className="relative z-10 mx-auto w-full max-w-7xl px-5 min-h-screen">

        <div className="py-25   md:py-0 md:grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] items-center gap-8 min-h-screen">

          {/* ================= LEFT CONTENT ================= */}
          <section
            className="
              flex flex-col
              items-center md:items-start
              justify-center
              text-center md:text-left
              space-y-4 sm:space-y-6
              mt-5 md:mt-0
              px-2
            "
          >

            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-gray-300">
              Forensic UI • Real-time confidence • Media preview
            </div>

            {/* Heading */}
            <h1 className="text-2xl sm:text-4xl md:text-6xl font-semibold tracking-tight leading-tight text-white">
              Deepfake Detection and Media Authenticity Analyzer
            </h1>

            {/* Description */}
            <motion.p className="max-w-xl leading-6 text-neutral-300">
              Upload a single image, video, or audio file and receive an
              authenticity verdict, confidence score, and risk level. Results
              are rendered with forensic widgets for rapid review.
            </motion.p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">

              {/* Primary Button */}
              <a
                href="/upload"
                className="
                  relative inline-flex h-11 items-center justify-center
                  rounded-full px-8 font-medium text-white
                  overflow-hidden transition-all duration-300
                  bg-gradient-to-br from-blue-900/60 via-indigo-800/60 to-purple-900/60
                  hover:from-blue-900/80 hover:via-indigo-800/80 hover:to-purple-900/80
                  shadow-[0_0_12px_rgba(99,102,241,0.5)]
                  hover:shadow-[0_0_20px_rgba(99,102,241,0.7)]
                  border-2 border-white/30
                "
              >
                Start Analysis
              </a>

              {/* Secondary Button */}
              <a
                href="/results"
                className="
                  relative inline-flex h-11 items-center justify-center
                  rounded-full px-8 font-medium text-neutral-300
                  overflow-hidden transition-all duration-300
                  border-2 border-white/30
                  hover:bg-white/10
                "
              >
                View Last Result
              </a>

            </div>
          </section>

          {/* ================= RIGHT IMAGE ================= */}
          <section className=" md:block relative md:h-full md:min-h-screen min-h-90">

            <img
              src="/main.png"
              alt="Preview"
              className="absolute bottom-0 right-0 w-150 object-contain"
            />

          </section>

        </div>
      </main>
    </div>
  );
}
