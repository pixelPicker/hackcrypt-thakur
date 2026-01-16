"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, FileWarning, Shield } from "lucide-react";

import { analyzeMedia } from "@/app/api";
import { UploadDropzone } from "@/components/UploadDropzone";
import { MediaPreview } from "@/components/MediaPreview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = React.useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    return () => {
      if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    };
  }, [mediaUrl]);

  const mutation = useMutation({
    mutationFn: async (f: File) => analyzeMedia(f),
    onSuccess: (result) => {
      try {
        sessionStorage.setItem("dfa:lastResult", JSON.stringify(result));
      } catch {}

      const params = new URLSearchParams();
      params.set("id", result.id ?? "local");
      if (mediaUrl) params.set("media", mediaUrl);
      if (file?.name) params.set("name", file.name);
      if (file?.type) params.set("type", file.type);
      router.push(`/results?${params.toString()}`);
    },
  });

  const handleFileSelected = React.useCallback((f: File) => {
    setFile(f);
    setMediaUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
  }, []);

  const canAnalyze = Boolean(file) && !mutation.isPending;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          Forensic Intake
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Upload media for authenticity analysis</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Drag & drop a single image, video, or audio file. The analyzer will return a verdict, confidence, and risk level.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Upload</CardTitle>
            <CardDescription>Supported: image / video / audio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <UploadDropzone disabled={mutation.isPending} onFileSelected={handleFileSelected} />

            <AnimatePresence initial={false}>
              {file && mediaUrl ? (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/40 px-4 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{file.name}</div>
                      <div className="text-xs text-muted-foreground">{file.type || "unknown"}</div>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setFile(null);
                        setMediaUrl((prev) => {
                          if (prev) URL.revokeObjectURL(prev);
                          return null;
                        });
                      }}
                      disabled={mutation.isPending}
                    >
                      Clear
                    </Button>
                  </div>

                  <MediaPreview file={file} url={mediaUrl} />
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                onClick={() => file && mutation.mutate(file)}
                disabled={!canAnalyze}
              >
                Analyze
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <AnimatePresence initial={false}>
              {mutation.isPending ? (
                <motion.div
                  key="progress"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="rounded-xl border border-border/60 bg-card/40 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium">Analyzing…</div>
                    <div className="text-xs text-muted-foreground">Sending to http://localhost:8000</div>
                  </div>
                  <div className="mt-2">
                    <Progress value={70} />
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {mutation.isError ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="rounded-xl border border-red-500/30 bg-red-500/10 p-4"
                >
                  <div className="flex items-start gap-3">
                    <FileWarning className="mt-0.5 h-4 w-4 text-red-200" />
                    <div>
                      <div className="text-sm font-medium text-red-100">Analysis request failed</div>
                      <div className="mt-1 text-xs text-red-200/80">
                        Ensure the backend is running on http://localhost:8000 and supports POST /analyze.
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline</CardTitle>
            <CardDescription>What happens after you upload</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-xl border border-border/60 bg-card/40 p-4">
              <div className="text-foreground/90">1. Media normalization</div>
              <div className="mt-1">File metadata is captured and prepared for forensic inference.</div>
            </div>
            <div className="rounded-xl border border-border/60 bg-card/40 p-4">
              <div className="text-foreground/90">2. Model inference</div>
              <div className="mt-1">The backend produces label, confidence, and optional localization/timeline signals.</div>
            </div>
            <div className="rounded-xl border border-border/60 bg-card/40 p-4">
              <div className="text-foreground/90">3. Results dashboard</div>
              <div className="mt-1">Forensic widgets render risk assessment with animated transitions.</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
