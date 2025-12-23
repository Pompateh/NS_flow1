"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import MoodboardImage from "./MoodboardImage";

export interface MoodboardAsset {
  id: string;
  url: string;
  filename: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  description: string | null;
  showDescription: boolean;
}

interface MoodboardCanvasProps {
  stepId: string;
  moodboardId?: string;
  assets: MoodboardAsset[];
  isAdmin: boolean;
}

// Internal coordinate system (positions are stored relative to this)
// Height must be divisible by GRID_SIZE for complete grid
const CANVAS_WIDTH = 1400; // 1400 / 50 = 28 cells
const CANVAS_HEIGHT = 650; // 650 / 50 = 13 cells
const MOBILE_ASPECT_RATIO = 4 / 3; // More square aspect ratio for mobile
const GRID_SIZE = 50; // Grid cell size for snapping

export default function MoodboardCanvas({ stepId, moodboardId, assets, isAdmin }: MoodboardCanvasProps) {
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [localAssets, setLocalAssets] = useState<MoodboardAsset[]>(assets);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [maxZIndex, setMaxZIndex] = useState(() => 
    Math.max(...assets.map(a => a.zIndex || 1), 1)
  );
  const [showPasteMenu, setShowPasteMenu] = useState(false);
  const [pasteMenuPosition, setPasteMenuPosition] = useState({ x: 0, y: 0 });
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalAssets(assets);
    setMaxZIndex(Math.max(...assets.map(a => a.zIndex || 1), 1));
  }, [assets]);

  // Handle paste only when this canvas is focused
  const uploadPastedImages = useCallback(async (files: File[]) => {
    if (!isAdmin || files.length === 0) return;

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
      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to upload pasted images:", err);
    }
  }, [stepId, moodboardId, isAdmin, router]);

  useEffect(() => {
    if (!isFocused || !isAdmin) return;

    function handlePaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        uploadPastedImages(imageFiles);
      }
    }

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [isFocused, isAdmin, uploadPastedImages]);

  const updateAsset = useCallback(async (
    assetId: string, 
    updates: Partial<MoodboardAsset>
  ) => {
    // Optimistic update
    setLocalAssets(prev => 
      prev.map(a => a.id === assetId ? { ...a, ...updates } : a)
    );

    if (!isAdmin) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/step/${stepId}/assets/${assetId}/position`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to save");
    } catch (err) {
      console.error("Failed to update asset:", err);
    } finally {
      setSaving(false);
    }
  }, [stepId, isAdmin]);

  const snapToGrid = useCallback((value: number) => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }, []);

  const handleDragEnd = useCallback((assetId: string, x: number, y: number) => {
    const snappedX = snapToGrid(x);
    const snappedY = snapToGrid(y);
    updateAsset(assetId, { positionX: snappedX, positionY: snappedY });
  }, [updateAsset, snapToGrid]);

  const handleResizeEnd = useCallback((assetId: string, width: number, height: number) => {
    const snappedW = Math.max(GRID_SIZE, snapToGrid(width));
    const snappedH = Math.max(GRID_SIZE, snapToGrid(height));
    updateAsset(assetId, { width: snappedW, height: snappedH });
  }, [updateAsset, snapToGrid]);

  const handleSelect = useCallback((assetId: string) => {
    if (!isAdmin) return;
    setSelectedId(assetId);
    // Bring to front
    const newZIndex = maxZIndex + 1;
    setMaxZIndex(newZIndex);
    updateAsset(assetId, { zIndex: newZIndex });
  }, [isAdmin, maxZIndex, updateAsset]);

  const handleDeselect = useCallback(() => {
    setSelectedId(null);
  }, []);

  const handleDescriptionChange = useCallback((assetId: string, description: string) => {
    updateAsset(assetId, { description });
  }, [updateAsset]);

  const handleToggleDescription = useCallback((assetId: string, show: boolean) => {
    updateAsset(assetId, { showDescription: show });
  }, [updateAsset]);

  const handleDelete = useCallback(async (assetId: string) => {
    if (!isAdmin) return;
    
    setLocalAssets(prev => prev.filter(a => a.id !== assetId));
    setSelectedId(null);

    try {
      const res = await fetch(`/api/admin/step/${stepId}/assets/${assetId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      router.refresh();
    } catch (err) {
      console.error("Failed to delete asset:", err);
      router.refresh();
    }
  }, [stepId, isAdmin, router]);

  // Click outside to deselect
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      handleDeselect();
      setShowPasteMenu(false);
    }
  }, [handleDeselect]);

  // Long press handler for mobile paste
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isAdmin) return;
    
    const touch = e.touches[0];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    longPressTimer.current = setTimeout(() => {
      setPasteMenuPosition({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      });
      setShowPasteMenu(true);
    }, 500); // 500ms long press
  }, [isAdmin]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchMove = useCallback(() => {
    // Cancel long press if user moves finger
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Handle paste from clipboard API (for mobile)
  const handlePasteFromClipboard = useCallback(async () => {
    setShowPasteMenu(false);
    try {
      const clipboardItems = await navigator.clipboard.read();
      const imageFiles: File[] = [];
      
      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.startsWith("image/")) {
            const blob = await item.getType(type);
            const file = new File([blob], `pasted-image-${Date.now()}.${type.split("/")[1]}`, { type });
            imageFiles.push(file);
          }
        }
      }
      
      if (imageFiles.length > 0) {
        await uploadPastedImages(imageFiles);
      }
    } catch (err) {
      console.error("Could not access clipboard:", err);
    }
  }, [uploadPastedImages]);

  return (
    <div className="relative">
      {saving && (
        <div className="absolute top-2 right-2 z-50 rounded bg-zinc-900 px-2 py-1 text-xs text-white">
          Saving...
        </div>
      )}
      
      <div
        ref={canvasRef}
        tabIndex={0}
        onClick={(e) => {
          handleCanvasClick(e);
          setIsFocused(true);
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onContextMenu={(e) => {
          if (!isAdmin) return;
          e.preventDefault();
          const rect = canvasRef.current?.getBoundingClientRect();
          if (!rect) return;
          setPasteMenuPosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          });
          setShowPasteMenu(true);
        }}
        className={`relative w-full overflow-hidden rounded-lg border-2 bg-white shadow-lg outline-none ${
          isFocused ? "border-blue-400" : "border-zinc-300"
        }`}
        style={{
          aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
        }}
      >

        {localAssets.map((asset) => (
          <MoodboardImage
            key={asset.id}
            asset={asset}
            isSelected={selectedId === asset.id}
            isAdmin={isAdmin}
            canvasWidth={CANVAS_WIDTH}
            canvasHeight={CANVAS_HEIGHT}
            onSelect={() => handleSelect(asset.id)}
            onDragEnd={(x, y) => handleDragEnd(asset.id, x, y)}
            onResizeEnd={(w, h) => handleResizeEnd(asset.id, w, h)}
            onDescriptionChange={(desc) => handleDescriptionChange(asset.id, desc)}
            onToggleDescription={(show) => handleToggleDescription(asset.id, show)}
            onDelete={() => handleDelete(asset.id)}
          />
        ))}

        {localAssets.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
            <p className="text-xs sm:text-sm text-center px-4">No images yet. Upload images to start your moodboard.</p>
          </div>
        )}

        {/* Paste context menu for mobile */}
        {showPasteMenu && isAdmin && (
          <div
            className="absolute z-50 bg-white rounded-lg shadow-xl border border-zinc-200 py-1 min-w-[120px]"
            style={{
              left: pasteMenuPosition.x,
              top: pasteMenuPosition.y,
            }}
          >
            <button
              onClick={handlePasteFromClipboard}
              className="w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 flex items-center gap-2"
            >
              Paste Image
            </button>
            <button
              onClick={() => setShowPasteMenu(false)}
              className="w-full px-4 py-2 text-left text-sm text-zinc-500 hover:bg-zinc-100"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
