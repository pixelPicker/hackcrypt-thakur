"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Eye, FileWarning, Shield, Trash } from "lucide-react";

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
import { Progress } from "@/components/ui/progress";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = React.useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = React.useState<string | null>(null);
  const [showPreview, setShowPreview] = React.useState(false);

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
      params.set("id", result.job_id); // Updated to match new API
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
    <div className="flex flex-col mx-auto w-full max-w-6xl p-5">
      {file && mediaUrl ? (
        <div
          className={`fixed inset-0 z-999 p-4 rounded-xl flex items-center justify-center bg-black/60 ${
            showPreview ? "block" : "hidden"
          }`}
          onClick={() => {
            setShowPreview((prev) => !prev);
          }}
        >
          <div className="relative">
            <MediaPreview file={file} url={mediaUrl} />
          </div>
        </div>
      ) : null}
      <div className="w-full max-w-4xl self-center">
        <Card className="border-0">
          <CardHeader>
            <CardTitle className="text-4xl">Upload Media</CardTitle>
            <CardDescription>
              Drag & drop a single image, video, or audio file. The analyzer
              will return a verdict, confidence, and risk level.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 ">
            <UploadDropzone
              disabled={mutation.isPending}
              onFileSelected={handleFileSelected}
            />

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
                      <div className="flex gap-4 truncate text-sm font-medium">
                        {file.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {file.type || "unknown"}
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setShowPreview((prev) => !prev);
                        }}
                        disabled={mutation.isPending}
                        className="cursor-pointer"
                      >
                        <Eye size={24} />
                      </Button>
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
                        className="cursor-pointer"
                      >
                        <Trash size={24} />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div className="flex items-center justify-end gap-3 cursor-pointer text-white">
              <Button
                onClick={() => file && mutation.mutate(file)}
                disabled={!canAnalyze}
                className="text-lg rounded-xl "
                variant="ghost"
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
                    <div className="text-xs text-muted-foreground">
                      Sending to http://localhost:8000
                    </div>
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
                      <div className="text-sm font-medium text-red-100">
                        Analysis request failed
                      </div>
                      <div className="mt-1 text-xs text-red-200/80">
                        Ensure the backend is running on http://localhost:8000
                        and supports POST /analyze.
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
