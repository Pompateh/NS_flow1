"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Edit2 } from "lucide-react";
import MoodboardCanvas from "./MoodboardCanvas";
import ImageUploadForm from "./ImageUploadForm";

interface MoodboardAsset {
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

interface Moodboard {
  id: string;
  name: string;
  order: number;
  assets: MoodboardAsset[];
}

interface MoodboardSectionProps {
  stepId: string;
  moodboards: Moodboard[];
  unassignedAssets: MoodboardAsset[];
  isAdmin: boolean;
}

export default function MoodboardSection({
  stepId,
  moodboards,
  unassignedAssets,
  isAdmin,
}: MoodboardSectionProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleCreateMoodboard = async () => {
    setCreating(true);
    try {
      const res = await fetch(`/api/admin/step/${stepId}/moodboards`, {
        method: "POST",
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to create moodboard:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteMoodboard = async (moodboardId: string) => {
    if (!confirm("Delete this moodboard and all its images?")) return;
    
    try {
      const res = await fetch(`/api/admin/step/${stepId}/moodboards/${moodboardId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to delete moodboard:", err);
    }
  };

  const handleRenameMoodboard = async (moodboardId: string) => {
    if (!editName.trim()) return;
    
    try {
      const res = await fetch(`/api/admin/step/${stepId}/moodboards/${moodboardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName }),
      });
      if (res.ok) {
        setEditingId(null);
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to rename moodboard:", err);
    }
  };

  const startEditing = (moodboard: Moodboard) => {
    setEditingId(moodboard.id);
    setEditName(moodboard.name);
  };

  const hasUnassigned = unassignedAssets.length > 0;
  const hasNoMoodboards = moodboards.length === 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Always show unassigned assets if they exist */}
      {hasUnassigned && (
        <div>
          <div className="flex items-center justify-between mb-2 gap-2">
            <h3 className="text-xs sm:text-sm font-medium text-zinc-700 truncate">
              {hasNoMoodboards ? "Concept 1" : "Unassigned"}
            </h3>
            {isAdmin && <ImageUploadForm stepId={stepId} />}
          </div>
          <MoodboardCanvas
            stepId={stepId}
            assets={unassignedAssets}
            isAdmin={isAdmin}
          />
        </div>
      )}

      {/* Named moodboards */}
      {moodboards.map((moodboard, index) => (
        <div key={moodboard.id}>
          <div className="flex items-center justify-between mb-2 gap-2">
            {editingId === moodboard.id ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRenameMoodboard(moodboard.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="px-2 py-1 text-sm border border-zinc-300 rounded"
                  autoFocus
                />
                <button
                  onClick={() => handleRenameMoodboard(moodboard.id)}
                  className="text-xs text-zinc-600 hover:text-zinc-900"
                >
                  Save
                </button>
              </div>
            ) : (
              <h3 className="text-xs sm:text-sm font-medium text-zinc-700 flex items-center gap-1 sm:gap-2 truncate">
                {moodboard.name}
                {isAdmin && (
                  <button
                    onClick={() => startEditing(moodboard)}
                    className="text-zinc-400 hover:text-zinc-600"
                  >
                    <Edit2 size={12} />
                  </button>
                )}
              </h3>
            )}
            
            {isAdmin && (
              <div className="flex items-center gap-2">
                <ImageUploadForm stepId={stepId} moodboardId={moodboard.id} />
                <button
                  onClick={() => handleDeleteMoodboard(moodboard.id)}
                  className="text-zinc-400 hover:text-red-600"
                  title="Delete moodboard"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
          <MoodboardCanvas
            stepId={stepId}
            moodboardId={moodboard.id}
            assets={moodboard.assets}
            isAdmin={isAdmin}
          />
        </div>
      ))}

      {/* Empty state - show Concept 1 with upload */}
      {hasNoMoodboards && !hasUnassigned && (
        <div>
          <div className="flex items-center justify-between mb-2 gap-2">
            <h3 className="text-xs sm:text-sm font-medium text-zinc-700">Concept 1</h3>
            {isAdmin && <ImageUploadForm stepId={stepId} />}
          </div>
          <MoodboardCanvas
            stepId={stepId}
            assets={[]}
            isAdmin={isAdmin}
          />
        </div>
      )}

      {/* Add new moodboard button */}
      {isAdmin && (
        <button
          onClick={handleCreateMoodboard}
          disabled={creating}
          className="w-full py-2 sm:py-3 border-2 border-dashed border-zinc-300 rounded-lg text-xs sm:text-sm text-zinc-500 hover:border-zinc-400 hover:text-zinc-600 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Plus size={16} />
          {creating ? "Creating..." : "Add New Concept Moodboard"}
        </button>
      )}
    </div>
  );
}
