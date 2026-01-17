"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Eye, FileWarning, X, Trash2 } from "lucide-react";

import { analyzeMedia } from "@/app/api";
import { UploadDropzone } from "@/components/UploadDropzone";
import { MediaPreview } from "@/components/MediaPreview";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { PageTransition } from "@/components/PageTransition";
import { cn } from "@/lib/utils";
import { useSessions } from "@/context/SessionContext";
import Link from "next/link";
import { getSession } from "next-auth/react";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = React.useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = React.useState<string | null>(null);
  const [showPreview, setShowPreview] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [analysisProgress, setAnalysisProgress] = React.useState(0);
  const { session, refresh } = useSessions();
  console.log({ session });
  // Clean up Object URLs to prevent memory leaks
  React.useEffect(() => {
    return () => {
      if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    };
  }, [mediaUrl]);

  const mutation = useMutation({
    mutationFn: async (f: File) => {
      const actualSession = await getSession();

      setUploadProgress(0);
      return analyzeMedia(f, actualSession ? "user" : "guest", (progress) => {
        setUploadProgress(progress);
      });
    },
    onSuccess: (result) => {
      try {
        sessionStorage.setItem("dfa:lastResult", JSON.stringify(result));
      } catch {}

      const params = new URLSearchParams();
      params.set("id", result.job_id);
      if (mediaUrl) params.set("media", mediaUrl);
      if (file?.name) params.set("name", file.name);
      if (file?.type) params.set("type", file.type);
      router.push(`/results?${params.toString()}`);
    },
    onError: (error: any) => {
      if (error.status === 429) {
        // TODO: ADD TOAST
        console.log("Rate limit exceeded");
      }
    },
    onSettled: () => {
      refresh();
    },
  });

  // Fake analysis progress bar logic
  React.useEffect(() => {
    if (uploadProgress === 100 && mutation.isPending) {
      setAnalysisProgress(0);
      const interval = setInterval(() => {
        setAnalysisProgress((prev) => {
          if (prev >= 98) return prev;
          const inc = prev < 30 ? 10 : prev < 60 ? 5 : 1;
          return Math.min(98, prev + inc);
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [uploadProgress, mutation.isPending]);

  const handleFileSelected = React.useCallback((f: File) => {
    setFile(f);
    setMediaUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
  }, []);

  const canAnalyze =
    Boolean(file) &&
    !mutation.isPending &&
    (session?.credits_left === null ||
      (typeof session?.credits_left === "number" && session.credits_left > 0));

  // Function to handle credit deduction and start analysis
  const handleStartAnalysis = async () => {
    if (!file) return;
    mutation.mutate(file);
  };

  // 🔥 THE ACTUAL RETURN THAT WAS MISSING
  return (
    <>
      <Navbar />
      <PageTransition className="flex flex-col mx-auto w-full max-w-6xl px-5 pt-28 relative pb-20">
        <AnimatePresence>
          {file && mediaUrl && showPreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 p-4 flex items-center justify-center bg-black/80 backdrop-blur-md"
              onClick={() => setShowPreview(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-5xl w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setShowPreview(false)}
                  className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors"
                >
                  <X size={32} />
                </button>
                <MediaPreview file={file} url={mediaUrl} className="w-full" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full max-w-3xl self-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-0 bg-transparent shadow-none">
              <CardHeader className="text-center pb-10">
                <CardTitle className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 mb-4">
                  Upload Media
                </CardTitle>
                <CardDescription className="text-lg text-muted-foreground/80 max-w-lg mx-auto">
                  Drag & drop your media to detect deepfakes with our advanced
                  multi-modal AI analysis engine.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <UploadDropzone
                  disabled={mutation.isPending}
                  onFileSelected={handleFileSelected}
                />

                <AnimatePresence mode="wait">
                  {file && mediaUrl && (
                    <motion.div
                      key="file-card"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                        <div className="min-w-0 flex-1">
                          <div className="flex gap-4 truncate text-base font-medium text-white">
                            {file.name}
                          </div>
                          <div className="text-xs text-blue-200/60 font-mono mt-1">
                            {file.type || "unknown"} •{" "}
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowPreview(true)}
                            disabled={mutation.isPending}
                            className="hover:bg-white/10 text-blue-300"
                          >
                            <Eye size={20} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setFile(null);
                              if (mediaUrl) URL.revokeObjectURL(mediaUrl);
                              setMediaUrl(null);
                            }}
                            disabled={mutation.isPending}
                            className="hover:bg-red-500/20 text-red-400 hover:text-red-300"
                          >
                            <Trash2 size={20} />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex flex-col items-center gap-6">
                  <Button
                    onClick={handleStartAnalysis}
                    disabled={!canAnalyze}
                    className={cn(
                      "relative group w-full max-w-xs h-14 rounded-full text-lg font-semibold overflow-hidden disabled:cursor-not-allowed transition-all duration-300",
                      canAnalyze
                        ? "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                        : "bg-muted text-muted-foreground cursor-not-allowed",
                    )}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Analyze Media
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>

                  {/* {session && (
                    <div className="text-sm text-muted-foreground mt-1">
                      Credits left:{" "}
                      <span className="font-semibold text-white">
                        {session.credits_left}
                      </span>
                    </div>
                  )} */}

                  {session &&
                    session.credits_left &&
                    session.credits_left < 1 && (
                      <Link
                        href={"/login"}
                        className="text-sm text-red-400 underline underline-offset-3"
                      >
                        Free limit reached. Please sign up to continue.
                      </Link>
                    )}

                  <AnimatePresence>
                    {mutation.isPending && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="w-full max-w-sm space-y-3"
                      >
                        <div className="flex justify-between text-sm font-medium text-blue-200/90 px-1">
                          <span className="flex items-center gap-2">
                            {uploadProgress < 100 ? (
                              <>
                                <span className="relative flex h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                                </span>
                                Uploading...
                              </>
                            ) : (
                              <>
                                <span className="relative flex h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
                                </span>
                                Analyzing Media...
                              </>
                            )}
                          </span>
                          <span>
                            {uploadProgress < 100
                              ? uploadProgress
                              : Math.round(analysisProgress)}
                            %
                          </span>
                        </div>

                        <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/5 border border-white/10 p-px">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${
                                uploadProgress < 100
                                  ? uploadProgress
                                  : analysisProgress
                              }%`,
                            }}
                            transition={{ ease: "easeOut", duration: 0.2 }}
                            className={cn(
                              "h-full rounded-full bg-linear-to-r shadow-[0_0_10px_rgba(59,130,246,0.5)]",
                              uploadProgress < 100
                                ? "from-blue-600 via-indigo-500 to-blue-600"
                                : "from-purple-600 via-fuchsia-500 to-purple-600 animate-pulse",
                            )}
                          />
                        </div>

                        <p className="text-center text-xs text-muted-foreground/80 animate-pulse">
                          {uploadProgress < 100
                            ? "Sending to secure cloud..."
                            : "Running multi-modal deepfake detection..."}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {mutation.isError && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 w-full"
                      >
                        <div className="flex items-start gap-3">
                          <FileWarning className="mt-0.5 h-5 w-5 text-red-400" />
                          <div>
                            <div className="text-sm font-semibold text-red-200">
                              Analysis Failed
                            </div>
                            <div className="mt-1 text-xs text-red-200/60 leading-relaxed">
                              {mutation.error?.message ||
                                "Could not connect to the backend server. Please ensure the analysis engine is running on port 8000."}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </PageTransition>
    </>
  );
}
