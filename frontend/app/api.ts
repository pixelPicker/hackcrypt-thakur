import { http } from "@/lib/axios";

export type MediaKind = "image" | "video" | "audio";

export type AnalysisLabel = "Authentic" | "Manipulated";

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

export type AnalysisResult = {
  id: string;
  label: AnalysisLabel;
  confidence: number;
  riskLevel: RiskLevel;
  mediaKind?: MediaKind;
  details?: Record<string, unknown>;
  heatmap?: HeatmapBox[];
  timeline?: TimelinePoint[];
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
  const confidenceRaw = raw?.confidence ?? raw?.prediction?.confidence ?? raw?.score ?? raw?.probability;
  const riskRaw = raw?.riskLevel ?? raw?.risk_level ?? raw?.risk;

  const timelineRaw = raw?.timeline ?? raw?.anomalies_timeline ?? raw?.anomalies ?? raw?.series;
  const heatmapRaw = raw?.heatmap ?? raw?.localization ?? raw?.regions;

  return {
    id: id || "local",
    label: normalizeLabel(labelRaw),
    confidence: normalizeConfidence(confidenceRaw),
    riskLevel: normalizeRiskLevel(riskRaw),
    mediaKind: raw?.mediaKind ?? raw?.media_kind,
    details: raw?.details ?? raw?.meta,
    timeline: normalizeTimeline(timelineRaw),
    heatmap: normalizeHeatmap(heatmapRaw),
  };
}

export async function analyzeMedia(file: File): Promise<AnalysisResult> {
  const form = new FormData();
  form.append("file", file);

  const res = await http.post("/analyze", form, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return normalizeAnalysisResult(res.data);
}

export async function getResult(id: string): Promise<AnalysisResult> {
  const res = await http.get(`/results/${encodeURIComponent(id)}`);
  return normalizeAnalysisResult(res.data);
}
