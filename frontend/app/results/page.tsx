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

export default function ResultsPage() {
  const router = useRouter();
  const search = useSearchParams();

  const id = search.get("id") ?? "";
  const media = search.get("media");
  const name = search.get("name") ?? "";
  const type = search.get("type") ?? "";

  const last = React.useMemo(() => readLastResult(), []);

  const shouldFetch = Boolean(id) && id !== "local";

  const query = useQuery({
    queryKey: ["result", id],
    queryFn: () => getResult(id),
    enabled: shouldFetch,
    initialData: !shouldFetch ? last ?? undefined : undefined,
  });

  const result = (shouldFetch ? query.data : last) ?? query.data;

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
              onClick={() => query.refetch()}
              disabled={query.isFetching}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          ) : null}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {query.isFetching ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mb-6 rounded-xl border border-border/60 bg-card/40 p-4"
          >
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Database className="h-4 w-4" />
              Fetching result from http://localhost:8000…
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
                label={result.label}
                confidence={result.confidence}
                riskLevel={result.riskLevel}
              />

              {media ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Media snapshot</div>
                  {isImage ? (
                    <HeatmapOverlay boxes={result.heatmap}>
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
              <Tabs defaultValue="timeline" className="w-full">
                <TabsList>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
                  <TabsTrigger value="raw">Raw</TabsTrigger>
                </TabsList>

                <TabsContent value="timeline">
                  <TimelineAnomalies timeline={result.timeline} />
                </TabsContent>

                <TabsContent value="heatmap">
                  <div className="rounded-xl border border-border/60 bg-card/40 p-4 text-sm text-muted-foreground">
                    {(result.heatmap?.length ?? 0) > 0
                      ? "Heatmap overlays are displayed on image snapshots when available."
                      : "No heatmap regions provided by backend."}
                  </div>
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
