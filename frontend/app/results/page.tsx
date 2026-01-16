"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Database, FileSearch, RefreshCw } from "lucide-react";

import type { AnalysisResult } from "@/app/api";
import { getResult } from "@/app/api";
import { ConfidenceScore } from "@/components/ConfidenceScore";
import { HeatmapOverlay } from "@/components/HeatmapOverlay";
import { TimelineAnomalies } from "@/components/TimelineAnomalies";
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
  const media = search.get("media");
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

  const isImage = type.startsWith("image/");
  const isAudio = type.startsWith("audio/");

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileSearch className="h-4 w-4" />
            Analysis Result
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
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

      {!hasResult ? (
        <Card>
          <CardHeader>
            <CardTitle>No result loaded</CardTitle>
            <CardDescription>
              Upload media to generate a new analysis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" onClick={() => router.push("/upload")}>
              Go to Upload
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Verdict</CardTitle>
              <CardDescription>
                Label, confidence, and risk scoring
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ConfidenceScore
                label={result?.label ?? "Authentic"}
                confidence={result?.confidence_score ?? 0}
                riskLevel={result?.risk_level ?? "Medium"}
              />

              {media ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Media snapshot</div>
                  {isImage ? (
                    <HeatmapOverlay boxes={result?.heatmap}>
                      <img
                        src={media}
                        alt={name || "uploaded"}
                        className="h-auto w-full rounded-xl border border-border/60 object-contain"
                      />
                    </HeatmapOverlay>
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

              {/* Modality Scores Breakdown */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Detection Breakdown</div>
                <div className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3">
                  {result?.modality_scores?.vision !== undefined && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Visual Analysis</span>
                        <span className="font-medium tabular-nums">
                          {(result.modality_scores.vision * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={result.modality_scores.vision * 100} />
                    </div>
                  )}

                  {result?.modality_scores?.audio !== undefined && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Audio Analysis</span>
                        <span className="font-medium tabular-nums">
                          {(result.modality_scores.audio * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={result.modality_scores.audio * 100} />
                    </div>
                  )}

                  {result?.modality_scores?.temporal !== undefined && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Temporal Analysis</span>
                        <span className="font-medium tabular-nums">
                          {(result.modality_scores.temporal * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={result.modality_scores.temporal * 100} />
                    </div>
                  )}

                  {result?.modality_scores?.metadata !== undefined && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Metadata Analysis</span>
                        <span className="font-medium tabular-nums">
                          {(result.modality_scores.metadata * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={result.modality_scores.metadata * 100} />
                    </div>
                  )}

                  <div className="border-t pt-3 mt-3">
                    <div className="text-xs text-muted-foreground">
                      Combined score from all detection modalities
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Signals</CardTitle>
              <CardDescription>
                Localization and temporal anomaly indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                defaultValue={
                  isImage && result?.heatmap?.length ? "heatmap" : "timeline"
                }
                className="w-full"
                key={id}
              >
                <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent p-0">
                  <TabsTrigger
                    value="timeline"
                    className="data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent rounded-none px-4 py-2 h-12"
                  >
                    Timeline
                  </TabsTrigger>
                  <TabsTrigger
                    value="heatmap"
                    className="data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent rounded-none px-4 py-2 h-12"
                  >
                    Heatmap
                  </TabsTrigger>
                  <TabsTrigger
                    value="raw"
                    className="data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent rounded-none px-4 py-2 h-12 ml-auto"
                  >
                    Raw Data
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="timeline">
                  {result?.timeline && result.timeline.length > 0 ? (
                    <TimelineAnomalies timeline={result.timeline} />
                  ) : (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      No temporal anomalies detected.
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="heatmap">
                  {result?.heatmap && result.heatmap.length > 0 && isImage ? (
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
                  )}
                </TabsContent>

                <TabsContent value="raw">
                  <pre className="max-h-[360px] overflow-auto rounded-xl border border-border/60 bg-card/40 p-4 text-xs text-muted-foreground">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
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
