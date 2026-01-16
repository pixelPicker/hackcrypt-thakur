"use client";

import * as React from "react";
import videojs from "video.js";
import WaveSurfer from "wavesurfer.js";

import { Button } from "@/components/ui/button";

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

  if (kind === "image") {
    return (
      <div className={className}>
        <img
          src={url}
          alt={file.name}
          className="h-auto w-full rounded-xl border border-border/60 object-contain"
        />
      </div>
    );
  }

  if (kind === "video") {
    return <VideoPreview url={url} className={className} />;
  }

  if (kind === "audio") {
    return <AudioPreview url={url} className={className} />;
  }

  return null;
}

function VideoPreview({ url, className }: { url: string; className?: string }) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const playerRef = React.useRef<ReturnType<typeof videojs> | null>(null);

  React.useEffect(() => {
    if (!videoRef.current) return;

    playerRef.current = videojs(videoRef.current, {
      controls: true,
      preload: "auto",
      fluid: true,
      sources: [{ src: url }],
    });

    return () => {
      playerRef.current?.dispose();
      playerRef.current = null;
    };
  }, [url]);

  return (
    <div className={className}>
      <div className="overflow-hidden rounded-xl border border-border/60">
        <div data-vjs-player>
          <video ref={videoRef} className="video-js vjs-big-play-centered" />
        </div>
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
      progressColor: "rgba(226, 232, 240, 0.9)",
      cursorColor: "rgba(226, 232, 240, 0.6)",
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
      <div className="rounded-xl border border-border/60 bg-card/40 p-4">
        <div ref={containerRef} />
        <div className="mt-3 flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={!ready}
            onClick={() => wsRef.current?.playPause()}
          >
            {playing ? "Pause" : "Play"}
          </Button>
          <div className="text-xs text-muted-foreground">
            Waveform analysis view
          </div>
        </div>
      </div>
    </div>
  );
}
