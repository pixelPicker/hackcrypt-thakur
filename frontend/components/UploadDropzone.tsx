"use client";

import * as React from "react";
import { useDropzone } from "react-dropzone";
import { FileVideo2, FileAudio2, Image as ImageIcon, UploadCloud } from "lucide-react";
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

export function UploadDropzone({ disabled, onFileSelected }: UploadDropzoneProps) {
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      {...getRootProps()}
      className={cn(
        "group relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-card/40 px-6 py-10 text-center outline-none transition-colors hover:bg-card/60",
        isDragActive && "border-primary/70 bg-secondary/40",
        disabled && "cursor-not-allowed opacity-70"
      )}
    >
      <input {...getInputProps()} />

      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/60 bg-background/40">
        <Icon className="h-6 w-6 text-foreground/80" />
      </div>

      <div className="space-y-1">
        <div className="text-base font-medium text-foreground">
          Drag & drop media here
        </div>
        <div className="text-sm text-muted-foreground">
          Image, video, or audio. Single file only.
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-border/60" />
    </motion.div>
  );
}
