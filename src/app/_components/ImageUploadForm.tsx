"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function ImageUploadForm({ stepId, moodboardId }: { stepId: string; moodboardId?: string }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | File[] | null) {
    if (!files) return;
    const fileArray = Array.isArray(files) ? files : Array.from(files);
    const images = fileArray.filter((f) => f.type.startsWith("image/"));
    if (images.length > 0) {
      setSelectedFiles((prev) => [...prev, ...images]);
      setError(null);
    }
  }

  const uploadFiles = useCallback(async (files: File[]) => {
    if (files.length === 0 || uploading) return;

    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("type", "IMAGE");
    if (moodboardId) {
      formData.append("moodboardId", moodboardId);
    }
    for (const file of files) {
      formData.append("files", file);
    }

    try {
      const res = await fetch(`/api/admin/step/${stepId}/assets`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }

      setSelectedFiles([]);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [stepId, moodboardId, uploading, router]);


  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setError("Select at least one image");
      return;
    }

    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("type", "IMAGE");
    for (const file of selectedFiles) {
      formData.append("files", file);
    }

    try {
      const res = await fetch(`/api/admin/step/${stepId}/assets`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }

      setSelectedFiles([]);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="relative inline-block">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          handleFiles(e.target.files);
          if (e.target.files && e.target.files.length > 0) {
            uploadFiles(Array.from(e.target.files).filter(f => f.type.startsWith("image/")));
          }
        }}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="text-xs text-zinc-500 hover:text-zinc-900 disabled:opacity-50 whitespace-nowrap"
      >
        {uploading ? "Uploading..." : "+ Add Image"}
      </button>
      {error && <p className="absolute top-full left-0 mt-1 text-xs text-red-600 whitespace-nowrap">{error}</p>}
    </div>
  );
}
