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
  assets: MoodboardAsset[];
  isAdmin: boolean;
}

// Internal coordinate system (positions are stored relative to this)
// Height must be divisible by GRID_SIZE for complete grid
const CANVAS_WIDTH = 1400; // 1400 / 50 = 28 cells
const CANVAS_HEIGHT = 650; // 650 / 50 = 13 cells
const GRID_SIZE = 50; // Grid cell size for snapping

export default function MoodboardCanvas({ stepId, assets, isAdmin }: MoodboardCanvasProps) {
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [localAssets, setLocalAssets] = useState<MoodboardAsset[]>(assets);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [maxZIndex, setMaxZIndex] = useState(() => 
    Math.max(...assets.map(a => a.zIndex || 1), 1)
  );

  useEffect(() => {
    setLocalAssets(assets);
    setMaxZIndex(Math.max(...assets.map(a => a.zIndex || 1), 1));
  }, [assets]);

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
    }
  }, [handleDeselect]);

  return (
    <div className="relative">
      {saving && (
        <div className="absolute top-2 right-2 z-50 rounded bg-zinc-900 px-2 py-1 text-xs text-white">
          Saving...
        </div>
      )}
      
      <div
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="relative w-full overflow-hidden rounded-lg border-2 border-zinc-300 bg-white shadow-lg"
        style={{
          aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
        }}
      >
        {/* Grid Lines - using percentage for responsive alignment */}
        <div className="pointer-events-none absolute inset-0 opacity-10">
          <div className="h-full w-full" style={{
            backgroundImage: `
              linear-gradient(to right, #666 1px, transparent 1px),
              linear-gradient(to bottom, #666 1px, transparent 1px)
            `,
            backgroundSize: `${(GRID_SIZE / CANVAS_WIDTH) * 100}% ${(GRID_SIZE / CANVAS_HEIGHT) * 100}%`,
          }} />
        </div>

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
            <p className="text-sm">No images yet. Upload images to start your moodboard.</p>
          </div>
        )}
      </div>

      {isAdmin && (
        <p className="mt-2 text-center text-xs text-zinc-500">
          A3 Canvas • Drag to move • Drag corners to resize • Click to select
        </p>
      )}
    </div>
  );
}
