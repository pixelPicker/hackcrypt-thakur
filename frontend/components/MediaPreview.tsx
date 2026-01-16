"use client";

import * as React from "react";
import WaveSurfer from "wavesurfer.js";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PauseCircle, PlayCircle } from "lucide-react";
import { motion } from "framer-motion";

export type MediaPreviewProps = {
  file?: File | null;
  url?: string | null;
  className?: string;
};

function getKind(file?: File | null) {
  const t = file?.type ?? "";
  if (t.startsWith("image/")) return "image";
  if (t.startsWith("video/")) return "video";
  if (t.startsWith("audio/")) return "audio";
  return "unknown";
}

export function MediaPreview({ file, url, className }: MediaPreviewProps) {
  const kind = getKind(file);

  if (!file || !url) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={className}
    >
      {kind === "image" && (
        <div className={className}>
          <img
            src={url}
            alt={file.name}
            className="h-72 w-auto rounded-xl object-contain shadow-2xl border border-white/10"
          />
        </div>
      )}

      {kind === "video" && <VideoPreview url={url} className={className} />}
      {kind === "audio" && <AudioPreview url={url} className={className} />}
    </motion.div>
  );
}

function VideoPreview({ url, className }: { url: string; className?: string }) {
  return (
    <div className={cn("max-w-3xl", className)}>
      <div className="relative mx-auto rounded-xl border border-white/10 overflow-hidden shadow-2xl">
        <video
          controls
          src={url}
          className="w-full h-full rounded-xl bg-black"
        />
      </div>
    </div>
  );
}

function AudioPreview({ url, className }: { url: string; className?: string }) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const wsRef = React.useRef<WaveSurfer | null>(null);
  const [ready, setReady] = React.useState(false);
  const [playing, setPlaying] = React.useState(false);

  React.useEffect(() => {
    if (!containerRef.current) return;

    wsRef.current = WaveSurfer.create({
      container: containerRef.current,
      height: 72,
      waveColor: "rgba(148, 163, 184, 0.5)",
      progressColor: "#60a5fa", // Blue-400
      cursorColor: "#93c5fd", // Blue-300
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      url,
    });

    const ws = wsRef.current;
    ws.on("ready", () => setReady(true));
    ws.on("play", () => setPlaying(true));
    ws.on("pause", () => setPlaying(false));
    ws.on("finish", () => setPlaying(false));

    return () => {
      wsRef.current?.destroy();
      wsRef.current = null;
    };
  }, [url]);

  return (
    <div className={className}>
      <div className="rounded-xl border border-white/10 bg-black/40 p-6 shadow-xl backdrop-blur-sm">
        <div ref={containerRef} />
        <div className="mt-4 flex flex-col items-center gap-5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={!ready}
            onClick={() => wsRef.current?.playPause()}
            className="cursor-pointer h-12 w-12 rounded-full hover:bg-white/10"
          >
            {playing ? (
              <PauseCircle className="h-8 w-8 text-blue-400" />
            ) : (
              <PlayCircle className="h-8 w-8 text-white" />
            )}
          </Button>
        </div>
        <div className="text-xs text-center mt-2 text-muted-foreground font-mono uppercase tracking-widest">
          Waveform Analysis
        </div>
      </div>
    </div>
  );
}
