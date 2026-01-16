"use client";

import * as React from "react";
import { useDropzone } from "react-dropzone";
import {
  FileVideo2,
  FileAudio2,
  Image as ImageIcon,
  UploadCloud,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

  const { onDrag, onDragStart, onDragEnd, onAnimationStart, ...rootProps } =
    getRootProps();

  return (
    <motion.div
      {...rootProps}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "group relative flex min-h-220px cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center outline-none transition-all duration-300 overflow-hidden",
        isDragActive
          ? "border-blue-500/50 bg-blue-500/10"
          : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20",
        disabled && "cursor-not-allowed opacity-70"
      )}
    >
      <input {...getInputProps()} />

      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <motion.div
        animate={
          isDragActive
            ? { scale: 1.1, rotate: 5, y: -5 }
            : { scale: 1, rotate: 0, y: 0 }
        }
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn(
          "relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border bg-background/50 backdrop-blur-sm shadow-xl",
          isDragActive
            ? "border-blue-500/50 shadow-blue-500/20"
            : "border-white/10 shadow-black/20"
        )}
      >
        <motion.div
          animate={isDragActive ? { y: [0, -5, 0] } : {}}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <Icon
            className={cn(
              "h-8 w-8 transition-colors",
              isDragActive
                ? "text-blue-400"
                : "text-muted-foreground group-hover:text-foreground"
            )}
          />
        </motion.div>
      </motion.div>

      <div className="relative z-10 space-y-2 mt-2">
        <motion.div
          animate={isDragActive ? { scale: 1.05 } : { scale: 1 }}
          className="text-lg font-semibold text-foreground tracking-tight"
        >
          {isDragActive ? (
            <span className="text-blue-400">Box it up!</span>
          ) : (
            "Upload Media"
          )}
        </motion.div>
        <div className="text-sm text-muted-foreground max-w-[200px] mx-auto leading-relaxed">
          Drag & drop or click to select <br />
          <span className="text-xs opacity-70">(Images, Videos, Audio)</span>
        </div>
      </div>

      {/* Animated Border Lines */}
      <AnimatePresence>
        {isDragActive && (
          <>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              exit={{ scaleX: 0 }}
              className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
            />
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              exit={{ scaleY: 0 }}
              className="absolute top-0 bottom-0 right-0 w-0.5 bg-gradient-to-b from-transparent via-purple-500 to-transparent"
            />
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              exit={{ scaleX: 0 }}
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
            />
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              exit={{ scaleY: 0 }}
              className="absolute top-0 bottom-0 left-0 w-0.5 bg-gradient-to-b from-transparent via-purple-500 to-transparent"
            />
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
