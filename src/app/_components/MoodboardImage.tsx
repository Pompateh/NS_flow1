"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { Trash2, Eye, EyeOff, Move, Maximize2 } from "lucide-react";
import type { MoodboardAsset } from "./MoodboardCanvas";

const GRID_SIZE = 50; // Must match MoodboardCanvas

interface MoodboardImageProps {
  asset: MoodboardAsset;
  isSelected: boolean;
  isAdmin: boolean;
  canvasWidth: number;
  canvasHeight: number;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
  onResizeEnd: (width: number, height: number) => void;
  onDescriptionChange: (description: string) => void;
  onToggleDescription: (show: boolean) => void;
  onDelete: () => void;
}

export default function MoodboardImage({
  asset,
  isSelected,
  isAdmin,
  canvasWidth,
  canvasHeight,
  onSelect,
  onDragEnd,
  onResizeEnd,
  onDescriptionChange,
  onToggleDescription,
  onDelete,
}: MoodboardImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [position, setPosition] = useState({ x: asset.positionX, y: asset.positionY });
  const [size, setSize] = useState({ width: asset.width, height: asset.height });
  const [editingDescription, setEditingDescription] = useState(false);
  const [localDescription, setLocalDescription] = useState(asset.description || "");

  const dragStart = useRef({ x: 0, y: 0, startX: 0, startY: 0 });
  const resizeStart = useRef({ x: 0, y: 0, startW: 0, startH: 0 });

  // Sync with prop changes
  useEffect(() => {
    setPosition({ x: asset.positionX, y: asset.positionY });
    setSize({ width: asset.width, height: asset.height });
    setLocalDescription(asset.description || "");
  }, [asset.positionX, asset.positionY, asset.width, asset.height, asset.description]);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isAdmin) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect();
    
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      startX: position.x,
      startY: position.y,
    };
  }, [isAdmin, onSelect, position]);

  const snapToGrid = useCallback((value: number) => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      
      // Get canvas scale factor
      const canvas = containerRef.current?.parentElement;
      const scale = canvas ? canvas.clientWidth / canvasWidth : 1;
      
      const rawX = dragStart.current.startX + dx / scale;
      const rawY = dragStart.current.startY + dy / scale;
      
      // Snap to grid while dragging for visual feedback
      // Strict boundary: image must stay completely inside canvas
      const maxX = canvasWidth - size.width;
      const maxY = canvasHeight - size.height;
      const snappedX = snapToGrid(rawX);
      const snappedY = snapToGrid(rawY);
      const newX = Math.max(0, Math.min(maxX, snappedX));
      const newY = Math.max(0, Math.min(maxY, snappedY));
      
      setPosition({ x: newX, y: newY });
    }
    
    if (isResizing) {
      const dx = e.clientX - resizeStart.current.x;
      const dy = e.clientY - resizeStart.current.y;
      
      const canvas = containerRef.current?.parentElement;
      const scale = canvas ? canvas.clientWidth / canvasWidth : 1;
      
      const rawW = resizeStart.current.startW + dx / scale;
      const rawH = resizeStart.current.startH + dy / scale;
      
      // Snap to grid while resizing
      const newW = Math.max(GRID_SIZE, snapToGrid(rawW));
      const newH = Math.max(GRID_SIZE, snapToGrid(rawH));
      
      setSize({ width: newW, height: newH });
    }
  }, [isDragging, isResizing, canvasWidth, canvasHeight, size.width, size.height, snapToGrid]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      onDragEnd(position.x, position.y);
    }
    if (isResizing) {
      setIsResizing(false);
      onResizeEnd(size.width, size.height);
    }
  }, [isDragging, isResizing, position, size, onDragEnd, onResizeEnd]);

  // Resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    if (!isAdmin) return;
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      startW: size.width,
      startH: size.height,
    };
  }, [isAdmin, size]);

  // Handle touch move
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isDragging || isResizing) {
      e.preventDefault(); // Prevent page scrolling while dragging
      e.stopPropagation();
      const touch = e.touches[0];
      handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent);
    }
  }, [isDragging, isResizing, handleMouseMove]);

  const handleTouchEnd = useCallback(() => {
    handleMouseUp();
  }, [handleMouseUp]);

  // Global mouse and touch events
  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleTouchEnd);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const handleDescriptionSave = () => {
    setEditingDescription(false);
    onDescriptionChange(localDescription);
  };

  // Convert internal coordinates to percentages for responsive rendering
  const leftPercent = (position.x / canvasWidth) * 100;
  const topPercent = (position.y / canvasHeight) * 100;
  const widthPercent = (size.width / canvasWidth) * 100;
  const heightPercent = (size.height / canvasHeight) * 100;

  return (
    <div
      ref={containerRef}
      className={`absolute select-none touch-none ${isDragging ? "cursor-grabbing" : isAdmin ? "cursor-grab" : ""}`}
      style={{
        left: `${leftPercent}%`,
        top: `${topPercent}%`,
        width: `${widthPercent}%`,
        height: `${heightPercent}%`,
        zIndex: asset.zIndex,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Image Container */}
      <div
        className={`relative h-full overflow-hidden border-2 bg-zinc-100 ${
          isSelected ? "border-blue-500" : "border-transparent hover:border-zinc-300"
        }`}
        onMouseDown={handleMouseDown}
        onTouchStart={(e) => {
          if (!isAdmin) return;
          e.preventDefault();
          const touch = e.touches[0];
          onSelect();
          setIsDragging(true);
          dragStart.current = {
            x: touch.clientX,
            y: touch.clientY,
            startX: position.x,
            startY: position.y,
          };
        }}
      >
        <Image
          src={asset.url}
          alt={asset.filename}
          fill
          unoptimized
          className="object-cover pointer-events-none"
          sizes="100%"
          draggable={false}
        />

        {/* Description Footer - Inside image at bottom */}
        {asset.showDescription && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 sm:px-2 py-1 sm:py-1.5 backdrop-blur-sm">
            {isAdmin && isSelected && editingDescription ? (
              <textarea
                value={localDescription}
                onChange={(e) => setLocalDescription(e.target.value)}
                onBlur={handleDescriptionSave}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleDescriptionSave();
                  }
                }}
                className="w-full text-xs text-white bg-transparent border-none outline-none placeholder-white/60 resize-none"
                placeholder="Add description..."
                rows={2}
                autoFocus
              />
            ) : (
              <p
                className={`text-xs text-white/90 break-words whitespace-pre-wrap ${isAdmin && isSelected ? "cursor-text hover:text-white" : ""}`}
                onClick={(e) => {
                  if (isAdmin && isSelected) {
                    e.stopPropagation();
                    setEditingDescription(true);
                  }
                }}
              >
                {asset.description || (isAdmin && isSelected ? "Click to add description..." : "")}
              </p>
            )}
          </div>
        )}

        {/* Admin Controls - Only show when selected */}
        {isAdmin && isSelected && (
          <>
            {/* Move indicator */}
            <div className="absolute top-1 left-1 rounded bg-blue-500 p-0.5 sm:p-1 text-white">
              <Move size={12} className="sm:w-[14px] sm:h-[14px]" />
            </div>

            {/* Resize handle */}
            <div
              className="absolute bottom-0 right-0 h-8 w-8 sm:h-6 sm:w-6 cursor-se-resize rounded-tl bg-blue-500 flex items-center justify-center touch-none"
              onMouseDown={handleResizeStart}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation(); // Prevent drag from triggering
                const touch = e.touches[0];
                setIsResizing(true);
                resizeStart.current = {
                  x: touch.clientX,
                  y: touch.clientY,
                  startW: size.width,
                  startH: size.height,
                };
              }}
              style={{ bottom: asset.showDescription ? '24px' : '0' }}
            >
              <Maximize2 size={10} className="sm:w-[12px] sm:h-[12px] text-white rotate-90" />
            </div>

            {/* Action buttons */}
            <div className="absolute top-1 right-1 flex gap-0.5 sm:gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleDescription(!asset.showDescription);
                }}
                className="rounded bg-zinc-800 p-1 sm:p-1.5 text-white hover:bg-zinc-700"
                title={asset.showDescription ? "Hide description" : "Show description"}
              >
                {asset.showDescription ? <EyeOff size={12} className="sm:w-[14px] sm:h-[14px]" /> : <Eye size={12} className="sm:w-[14px] sm:h-[14px]" />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Delete this image?")) onDelete();
                }}
                className="rounded bg-red-600 p-1 sm:p-1.5 text-white hover:bg-red-500"
                title="Delete image"
              >
                <Trash2 size={12} className="sm:w-[14px] sm:h-[14px]" />
              </button>
            </div>
          </>
        )}
      </div>

    </div>
  );
}
