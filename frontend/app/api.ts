import { http } from "@/lib/axios";

export type MediaKind = "image" | "video" | "audio";

export type AnalysisLabel = "Authentic" | "Suspicious" | "Manipulated";

export type RiskLevel = "Low" | "Medium" | "High";

export type HeatmapBox = {
  x: number;
  y: number;
  w: number;
  h: number;
  intensity: number;
};

export type TimelinePoint = {
  t: number;
  score: number;
};

export type ModalityScores = {
  vision?: number;
  audio?: number;
  temporal?: number;
  lipsync?: number;
  metadata?: number;
};

export type AnalysisResult = {
  job_id: string;
  label: AnalysisLabel;
  confidence_score: number;
  risk_level: RiskLevel;
  modality_scores?: ModalityScores;
  media_type?: string;
  media_url?: string;
  processing_time_ms?: number;
  explainability?: Record<string, unknown>;
  heatmap?: HeatmapBox[];
  timeline?: TimelinePoint[];

  // Legacy fields for backward compatibility
  id?: string;
  confidence?: number;
  riskLevel?: RiskLevel;
  mediaKind?: MediaKind;
  details?: Record<string, unknown>;
};

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function normalizeRiskLevel(v: unknown): RiskLevel {
  const s = String(v ?? "").toLowerCase();
  if (s.includes("high")) return "High";
  if (s.includes("med")) return "Medium";
  return "Low";
}

function normalizeLabel(v: unknown): AnalysisLabel {
  const s = String(v ?? "").toLowerCase();
  if (s.includes("fake") || s.includes("manip") || s.includes("deepfake")) return "Manipulated";
  if (s.includes("suspicious")) return "Suspicious";
  return "Authentic";
}

function normalizeConfidence(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  if (Number.isFinite(n)) {
    const maybePercent = n > 1 ? n : n * 100;
    return Math.max(0, Math.min(100, Math.round(maybePercent * 10) / 10));
  }
  return 0;
}

function normalizeTimeline(v: unknown): TimelinePoint[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const points: TimelinePoint[] = [];
  for (const p of v) {
    if (!p || typeof p !== "object") continue;
    const t = Number((p as any).t ?? (p as any).time ?? (p as any).x);
    const score = normalizeConfidence((p as any).score ?? (p as any).y ?? (p as any).value) / 100;
    if (!Number.isFinite(t)) continue;
    points.push({ t, score: clamp01(score) });
  }
  return points.length ? points : undefined;
}

function normalizeHeatmap(v: unknown): HeatmapBox[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const boxes: HeatmapBox[] = [];
  for (const b of v) {
    if (!b || typeof b !== "object") continue;
    const x = Number((b as any).x);
    const y = Number((b as any).y);
    const w = Number((b as any).w ?? (b as any).width);
    const h = Number((b as any).h ?? (b as any).height);
    const intensity = Number((b as any).intensity ?? (b as any).score ?? 0.5);
    if (![x, y, w, h].every(Number.isFinite)) continue;
    boxes.push({ x: clamp01(x), y: clamp01(y), w: clamp01(w), h: clamp01(h), intensity: clamp01(intensity) });
  }
  return boxes.length ? boxes : undefined;
}

export function normalizeAnalysisResult(raw: any): AnalysisResult {
  const id = String(raw?.id ?? raw?.job_id ?? raw?.jobId ?? raw?.result_id ?? "");

  const labelRaw = raw?.label ?? raw?.prediction?.label ?? raw?.class ?? raw?.result ?? raw?.verdict;
  const confidenceRaw = raw?.confidence_score ?? raw?.confidence ?? raw?.prediction?.confidence ?? raw?.score ?? raw?.probability;
  const riskRaw = raw?.riskLevel ?? raw?.risk_level ?? raw?.risk;

  const timelineRaw = raw?.timeline ?? raw?.anomalies_timeline ?? raw?.explainability?.anomalies_timeline ?? raw?.anomalies ?? raw?.series;
  const heatmapRaw = raw?.heatmap ?? raw?.explainability?.heatmap ?? raw?.localization ?? raw?.regions;

  return {
    job_id: id || "local",
    label: normalizeLabel(labelRaw),
    confidence_score: normalizeConfidence(confidenceRaw), // Returns 0-100 (percentage)
    risk_level: normalizeRiskLevel(riskRaw),
    modality_scores: raw?.modality_scores,
    media_type: raw?.mediaKind ?? raw?.media_kind ?? raw?.media_type,
    media_url: raw?.media_url ?? raw?.url,
    processing_time_ms: raw?.processing_time_ms,
    explainability: raw?.explainability ?? raw?.details ?? raw?.meta,
    timeline: normalizeTimeline(timelineRaw),
    heatmap: normalizeHeatmap(heatmapRaw),
  };
}

export async function analyzeMedia(
  file: File,
  onProgress?: (progress: number) => void
): Promise<AnalysisResult> {
  const form = new FormData();
  form.append("file", file);

  const res = await http.post("/analyze", form, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });

  return normalizeAnalysisResult(res.data);
}

export async function getResult(id: string): Promise<AnalysisResult> {
  const res = await http.get(`/results/${encodeURIComponent(id)}`);
  return normalizeAnalysisResult(res.data);
}
