"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clipboard } from "lucide-react";

export default function ImageUploadForm({ stepId, moodboardId }: { stepId: string; moodboardId?: string }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [pasting, setPasting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showPasteArea, setShowPasteArea] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pasteAreaRef = useRef<HTMLDivElement>(null);

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

  // Upload images from paste event - works on all platforms including mobile
  const uploadPastedImages = useCallback(async (imageFiles: File[]) => {
    if (imageFiles.length === 0) {
      setError("No image found");
      return;
    }

    setPasting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("type", "IMAGE");
      if (moodboardId) {
        formData.append("moodboardId", moodboardId);
      }
      for (const file of imageFiles) {
        formData.append("files", file);
      }

      const res = await fetch(`/api/admin/step/${stepId}/assets`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }

      setShowPasteArea(false);
      router.refresh();
    } catch (err) {
      console.error("Paste upload error:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setPasting(false);
    }
  }, [stepId, moodboardId, router]);

  // Handle paste event - works on mobile/iPad via contenteditable div
  const handlePasteEvent = useCallback((e: ClipboardEvent) => {
    if (pasting || uploading) return;
    
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      uploadPastedImages(imageFiles);
    }
  }, [pasting, uploading, uploadPastedImages]);

  // Show paste area and focus it for mobile paste support
  const handlePasteButtonClick = useCallback(() => {
    setShowPasteArea(true);
    setError(null);
    // Focus will happen in useEffect after render
  }, []);

  // Focus paste area when shown
  useEffect(() => {
    if (showPasteArea && pasteAreaRef.current) {
      pasteAreaRef.current.focus();
    }
  }, [showPasteArea]);

  // Add paste event listener to paste area
  useEffect(() => {
    const pasteArea = pasteAreaRef.current;
    if (!pasteArea || !showPasteArea) return;

    pasteArea.addEventListener("paste", handlePasteEvent);
    return () => {
      pasteArea.removeEventListener("paste", handlePasteEvent);
    };
  }, [showPasteArea, handlePasteEvent]);

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
    <div className="relative inline-flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={async (e) => {
          const files = e.target.files;
          if (!files || files.length === 0) return;
          
          const imageFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
          if (imageFiles.length === 0) {
            setError("No valid images selected");
            return;
          }
          
          // Direct upload for mobile compatibility
          setUploading(true);
          setError(null);
          
          try {
            const formData = new FormData();
            formData.append("type", "IMAGE");
            if (moodboardId) {
              formData.append("moodboardId", moodboardId);
            }
            for (const file of imageFiles) {
              formData.append("files", file);
            }

            const res = await fetch(`/api/admin/step/${stepId}/assets`, {
              method: "POST",
              body: formData,
            });

            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              throw new Error(data.error || "Upload failed");
            }

            if (inputRef.current) inputRef.current.value = "";
            router.refresh();
          } catch (err) {
            console.error("Upload error:", err);
            setError(err instanceof Error ? err.message : "Upload failed");
          } finally {
            setUploading(false);
          }
        }}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading || pasting}
        className="text-xs text-zinc-500 hover:text-zinc-900 disabled:opacity-50 whitespace-nowrap"
      >
        {uploading ? "Uploading..." : "+ Add"}
      </button>
      <button
        type="button"
        onClick={handlePasteButtonClick}
        disabled={uploading || pasting}
        className="text-zinc-500 hover:text-zinc-900 disabled:opacity-50"
        title="Paste image from clipboard"
      >
        {pasting ? (
          <span className="text-xs">Pasting...</span>
        ) : (
          <Clipboard size={14} />
        )}
      </button>
      {error && <p className="absolute top-full left-0 mt-1 text-xs text-red-600 whitespace-nowrap">{error}</p>}
      
      {/* Paste area modal for mobile/iPad compatibility */}
      {showPasteArea && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPasteArea(false)}>
          <div className="bg-white rounded-lg p-6 m-4 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Paste Image</h3>
            <p className="text-sm text-zinc-600 mb-4">
              Tap the box below, then paste your image (long-press → Paste on mobile)
            </p>
            <div
              ref={pasteAreaRef}
              contentEditable
              suppressContentEditableWarning
              className="w-full h-32 border-2 border-dashed border-zinc-300 rounded-lg flex items-center justify-center text-zinc-400 text-sm focus:border-blue-500 focus:outline-none cursor-text"
              style={{ WebkitUserSelect: "text", userSelect: "text" }}
              onInput={(e) => {
                // Clear any text content that might be pasted
                const target = e.currentTarget;
                if (target.textContent) {
                  target.textContent = "";
                }
              }}
            >
              {pasting ? "Uploading..." : "Tap here and paste"}
            </div>
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={() => setShowPasteArea(false)}
                className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
