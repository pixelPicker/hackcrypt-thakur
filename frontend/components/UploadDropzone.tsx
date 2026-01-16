"use client";

import * as React from "react";
import { useDropzone } from "react-dropzone";
import {
  FileVideo2,
  FileAudio2,
  Image as ImageIcon,
  UploadCloud,
} from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export type UploadDropzoneProps = {
  disabled?: boolean;
  onFileSelected: (file: File) => void;
};

function iconFor(file?: File) {
  if (!file) return UploadCloud;
  const t = file.type;
  if (t.startsWith("image/")) return ImageIcon;
  if (t.startsWith("video/")) return FileVideo2;
  if (t.startsWith("audio/")) return FileAudio2;
  return UploadCloud;
}

export function UploadDropzone({
  disabled,
  onFileSelected,
}: UploadDropzoneProps) {
  const onDrop = React.useCallback(
    (accepted: File[]) => {
      const f = accepted[0];
      if (f) onFileSelected(f);
    },
    [onFileSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled,
    multiple: false,
    accept: {
      "image/*": [],
      "video/*": [],
      "audio/*": [],
    },
  });

  const Icon = iconFor();

  return (
    <div
      {...getRootProps()}
      className={cn(
        "group relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border/70 bg-card/40 px-6 py-10 text-center outline-none transition-all duration-300 hover:bg-card/60 hover:border-border hover:scale-[1.01]",
        isDragActive && "border-primary/70 bg-secondary/40 scale-[1.02]",
        disabled && "cursor-not-allowed opacity-70"
      )}
      style={{
        animation: "slideUp 0.3s ease-out",
      }}
    >
      <input {...getInputProps()} />

      <motion.div
        animate={
          isDragActive ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }
        }
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="flex h-14 w-14 items-center justify-center rounded-xl border border-border/60 bg-background/40 backdrop-blur-sm"
      >
        <motion.div
          animate={isDragActive ? { y: [0, -5, 0] } : {}}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <Icon className="h-7 w-7 text-foreground/80" />
        </motion.div>
      </motion.div>

      <div className="space-y-1">
        <motion.div
          animate={isDragActive ? { scale: 1.05 } : { scale: 1 }}
          className="text-base font-medium text-foreground"
        >
          {isDragActive ? "Drop it here!" : "Drag & drop media here"}
        </motion.div>
        <div className="text-sm text-muted-foreground">
          Image, video, or audio. Single file only.
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-border/60" />

      {/* Animated gradient border on drag */}
      {isDragActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20"
        />
      )}
    </div>
  );
}
