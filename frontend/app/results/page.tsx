"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Database,
  FileSearch,
  RefreshCw,
  Eye,
  Volume2,
  Clock,
  Mic,
} from "lucide-react";

import type { AnalysisResult } from "@/app/api";
import { getResult } from "@/app/api";
import { ConfidenceScore } from "@/components/ConfidenceScore";
import { HeatmapOverlay } from "@/components/HeatmapOverlay";
import { TimelineAnomalies } from "@/components/TimelineAnomalies";
import { ModalityCard } from "@/components/ModalityCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/Navbar";
import clsx from "clsx";

function readLastResult(): AnalysisResult | null {
  try {
    const raw = sessionStorage.getItem("dfa:lastResult");
    if (!raw) return null;
    return JSON.parse(raw) as AnalysisResult;
  } catch {
    return null;
  }
}

function ResultsContent() {
  const router = useRouter();
  const search = useSearchParams();

  const id = search.get("id") ?? "";
  const queryMedia = search.get("media");
  const name = search.get("name") ?? "";
  const type = search.get("type") ?? "";

  const last = React.useMemo(() => readLastResult(), []);
  const shouldFetch = Boolean(id) && id !== "local";

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["result", id],
    queryFn: () => getResult(id),
    enabled: shouldFetch,
    initialData: !shouldFetch ? last ?? undefined : undefined,
  });

  const result = data;
  const hasResult = Boolean(result);
  const [activityType, setActivityType] = React.useState<"image" | "heatmap">(
    "image",
  );
  // Use backend Persistent URL if available, otherwise fall back to query param (blob)
  const media = result?.media_url ?? queryMedia;

  const isImage = type.startsWith("image/");
  const isAudio = type.startsWith("audio/");

  return (
    <>
      <Navbar />
      <div className="mx-auto w-full px-8 grid grid-cols-3 items-start gap-8 pt-24">
        <div className="sticky top-24">
          {isImage && (
            <div className="flex flex-col w-full justify-between items-center gap-4">
              <div
                className={clsx(
                  activityType === "image"
                    ? "before:left-0"
                    : "before:left-1/2",
                  " relative grid grid-cols-2 font-medium gap-2 py-2 mb-4 rounded-lg",
                  "before:content-[''] w-full before:w-[calc(50%-8px)] before:h-[calc(100%-8px)] before:rounded-lg before:-z-10 before:m-1 before:bg-neutral-400 before:absolute before:top-0 before:transition-all",
                )}
              >
                <button
                  className={clsx(
                    "text-center py-2 px-8 rounded-lg cursor-pointer transition",
                    activityType === "image" ? "text-black" : "text-white",
                  )}
                  onClick={() => setActivityType("image")}
                >
                  <div></div>
                  Image
                </button>
                <button
                  className={clsx(
                    "text-center py-2 px-8 rounded-lg cursor-pointer transition",
                    activityType === "heatmap" ? "text-black" : "text-white",
                  )}
                  onClick={() => setActivityType("heatmap")}
                >
                  Heatmap
                </button>
              </div>
            </div>
          )}
          {media ? (
            <div className="space-y-2 max-h-60">
              {isImage ? (
                activityType === "image" ? (
                  <img
                    src={media}
                    alt={name || "uploaded"}
                    className="h-auto w-full rounded-xl border border-border/60 object-contain"
                  />
                ) : result?.heatmap && result.heatmap.length > 0 && isImage ? (
                  media ? (
                    <div className="rounded-xl border border-border/60 overflow-hidden bg-black/5 relative">
                      <HeatmapOverlay
                        boxes={result.heatmap}
                        className="w-full h-full"
                      >
                        <img
                          src={media}
                          alt="Heatmap Analysis"
                          className="w-full h-auto object-contain"
                        />
                      </HeatmapOverlay>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border/60 bg-card/40 p-8 text-center text-sm text-muted-foreground text-yellow-500">
                      Heatmap data is available, but the media snapshot has
                      expired. Please re-upload the file to view the overlay.
                    </div>
                  )
                ) : (
                  <div className="rounded-xl border border-border/60 bg-card/40 p-8 text-center text-sm text-muted-foreground">
                    {(result?.heatmap?.length ?? 0) > 0 && !isImage
                      ? "Heatmaps are only available for image analysis."
                      : "No heatmap regions detected."}
                  </div>
                )
              ) : isAudio ? (
                <audio
                  src={media}
                  controls
                  className="w-full rounded-xl border border-border/60"
                />
              ) : (
                <video
                  src={media}
                  controls
                  className="w-full rounded-xl border border-border/60"
                />
              )}
            </div>
          ) : null}
        </div>
        {hasResult && result ? (
          <div className="mb-6 col-span-2 w-full space-y-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-semibold tracking-tight">
                  Forensic dashboard
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {name ? name : "Uploaded media"}
                  {type ? ` • ${type}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.push("/upload")}
                  className="cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  New upload
                </Button>
                {shouldFetch ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => refetch()}
                    disabled={isFetching}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center space-y-4 rounded-xl p-4">
                <ConfidenceScore
                  label={result?.label ?? "Authentic"}
                  confidence={result?.confidence_score ?? 0}
                  riskLevel={result?.risk_level ?? "Medium"}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {result.modality_scores && result.modality_scores.vision && (
                  <div className="border-2 border-neutral-700/50 bg-linear-to-tr from-neutral-800/50 to-neutral-700/50 rounded-xl space-y-1 p-4 pt-6 flex flex-col">
                    <p className="text-4xl text-right font-medium flex-1">
                      {result.modality_scores.vision.toFixed(1)}%
                    </p>
                    <div>
                      <h3 className="text-xl">Visual Frame Analysis</h3>
                      <p className="text-sm line-clamp-2">
                        Deep learning-based frame manipulation detection
                      </p>
                    </div>
                  </div>
                )}

                {result.modality_scores && (
                  <div className="border-2 border-neutral-700/50 bg-linear-to-tr from-neutral-800/50 to-neutral-700/50 rounded-xl space-y-4 p-4 pt-6 flex flex-col">
                    <p className="text-4xl text-right font-medium flex-1">
                      {result.modality_scores.audio?.toFixed(1) ?? 0}%
                    </p>
                    <div>
                      <h3 className="text-xl">Audio Deepfake Detection</h3>
                      <p className="text-sm line-clamp-2">
                        Spectral analysis and AI-based voice synthesis detection
                      </p>
                    </div>
                  </div>
                )}

                {result.modality_scores && (
                  <div className="border-2 border-neutral-700/50 bg-linear-to-tr from-neutral-800/50 to-neutral-700/50 rounded-xl space-y-4 p-4 pt-6 flex flex-col">
                    <p className="text-4xl text-right font-medium flex-1">
                      {result.modality_scores.temporal?.toFixed(1) ?? 0}%
                    </p>
                    <div>
                      <h3 className="text-xl">Temporal Consistency</h3>
                      <p className="text-sm line-clamp-2">
                        Frame-to-frame transition and motion pattern analysis
                      </p>
                    </div>
                  </div>
                )}

                {result.modality_scores && (
                  <div className="border-2 border-neutral-700/50 bg-linear-to-tr from-neutral-800/50 to-neutral-700/50 rounded-xl space-y-4 p-4 pt-6 flex flex-col">
                    <p className="text-4xl text-right font-medium flex-1">
                      {result.modality_scores.lipsync?.toFixed(1) ?? 0}%
                    </p>
                    <div>
                      <h3 className="text-xl">Lip-sync Verification</h3>
                      <p className="text-sm line-clamp-2">
                        Audio-visual synchronization correlation analysis{" "}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {result?.timeline && result.timeline.length > 0 ? (
              <TimelineAnomalies timeline={result.timeline} />
            ) : null}

            {/* <TabsContent value="raw">
                    <pre className="max-h-[360px] overflow-auto rounded-xl border border-border/60 bg-card/40 p-4 text-xs text-muted-foreground">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </TabsContent> */}

            <div className="space-y-2">
              <div className="text-sm font-medium">Detection Breakdown</div>
              <div className="rounded-xl py-6">
                {result?.modality_scores?.vision !== undefined && (
                  <div>
                    <div className="flex items-center bg-neutral-700/50 p-3 justify-between text-sm">
                      <span>Visual Analysis</span>
                      <span className="font-medium tabular-nums">
                        {(result.modality_scores.vision * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={result.modality_scores.vision * 100} />
                  </div>
                )}

                {result?.modality_scores?.audio !== undefined && (
                  <div className="">
                    <div className="flex items-center justify-between p-3 text-sm">
                      <span>Audio Analysis</span>
                      <span className="font-medium tabular-nums">
                        {(result.modality_scores.audio * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={result.modality_scores.audio * 100} />
                  </div>
                )}

                {result?.modality_scores?.temporal !== undefined && (
                  <div className="">
                    <div className="flex items-center justify-between bg-neutral-700/50 p-3 text-sm">
                      <span>Temporal Analysis</span>
                      <span className="font-medium tabular-nums">
                        {(result.modality_scores.temporal * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={result.modality_scores.temporal * 100} />
                  </div>
                )}

                {result?.modality_scores?.lipsync !== undefined && (
                  <div className="">
                    <div className="flex items-center p-3 justify-between text-sm">
                      <span>Lip-sync Analysis</span>
                      <span className="font-medium tabular-nums">
                        {(result.modality_scores.lipsync * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={result.modality_scores.lipsync * 100} />
                  </div>
                )}

                {result?.modality_scores?.metadata !== undefined && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-neutral-700/50 p-3 text-sm">
                      <span>Metadata Analysis</span>
                      <span className="font-medium tabular-nums">
                        {(result.modality_scores.metadata * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={result.modality_scores.metadata * 100} />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {isFetching ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="mb-6 rounded-xl border border-border/60 bg-card/40 p-4"
              >
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Database className="h-4 w-4 animate-pulse" />
                  Fetching result from backend…
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        )}
      </div>
    </>
  );
}

export default function ResultsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="mx-auto w-full max-w-6xl px-5 py-8">Loading...</div>
      }
    >
      <ResultsContent />
    </React.Suspense>
  );
}
