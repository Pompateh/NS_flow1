"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Lock, Unlock } from "lucide-react";
import MoodboardCanvas from "./MoodboardCanvas";
import ImageUploadForm from "./ImageUploadForm";
import FileUploadForm from "./FileUploadForm";

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
  content: string;
  isLocked: boolean;
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
  const [savingContent, setSavingContent] = useState<string | null>(null);
  const [togglingLock, setTogglingLock] = useState<string | null>(null);
  const [concept1Locked, setConcept1Locked] = useState(false);
  
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

  const handleDeleteMoodboard = async (moodboardId: string, isLocked: boolean) => {
    if (isLocked) {
      alert("Unlock the moodboard first before deleting.");
      return;
    }
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

  const handleSaveContent = async (moodboardId: string, content: string) => {
    setSavingContent(moodboardId);
    try {
      const res = await fetch(`/api/admin/step/${stepId}/moodboards/${moodboardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to save content:", err);
    } finally {
      setSavingContent(null);
    }
  };

  const handleToggleLock = async (moodboardId: string, currentLocked: boolean) => {
    setTogglingLock(moodboardId);
    try {
      const res = await fetch(`/api/admin/step/${stepId}/moodboards/${moodboardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLocked: !currentLocked }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to toggle lock:", err);
    } finally {
      setTogglingLock(null);
    }
  };

  
  const hasUnassigned = unassignedAssets.length > 0;
  const hasNoMoodboards = moodboards.length === 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Always show unassigned assets if they exist */}
      {hasUnassigned && (
        <div>
          <div className="flex items-center justify-between mb-2 gap-2">
            <h3 className="text-xs sm:text-sm font-medium text-zinc-700 truncate flex items-center gap-2">
              Concept 1
              {concept1Locked && <Lock size={12} className="text-amber-500" />}
            </h3>
            {isAdmin && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConcept1Locked(!concept1Locked)}
                  className={`${concept1Locked ? "text-amber-500 hover:text-amber-600" : "text-zinc-400 hover:text-zinc-600"}`}
                  title={concept1Locked ? "Unlock moodboard" : "Lock moodboard"}
                >
                  {concept1Locked ? <Lock size={14} /> : <Unlock size={14} />}
                </button>
                {!concept1Locked && <ImageUploadForm stepId={stepId} />}
              </div>
            )}
          </div>
          <MoodboardCanvas
            stepId={stepId}
            assets={unassignedAssets}
            isAdmin={isAdmin && !concept1Locked}
          />
        </div>
      )}

      {/* Named moodboards */}
      {moodboards.map((moodboard, index) => (
        <div key={moodboard.id}>
          <div className="flex items-center justify-between mb-2 gap-2">
            <h3 className="text-xs sm:text-sm font-medium text-zinc-700 truncate flex items-center gap-2">
              Concept {index + 2}
              {moodboard.isLocked && <Lock size={12} className="text-amber-500" />}
            </h3>
            
            {isAdmin && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleLock(moodboard.id, moodboard.isLocked)}
                  disabled={togglingLock === moodboard.id}
                  className={`${moodboard.isLocked ? "text-amber-500 hover:text-amber-600" : "text-zinc-400 hover:text-zinc-600"} disabled:opacity-50`}
                  title={moodboard.isLocked ? "Unlock moodboard" : "Lock moodboard"}
                >
                  {moodboard.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                </button>
                {!moodboard.isLocked && (
                  <>
                    <ImageUploadForm stepId={stepId} moodboardId={moodboard.id} />
                    <button
                      onClick={() => handleDeleteMoodboard(moodboard.id, moodboard.isLocked)}
                      className="text-zinc-400 hover:text-red-600"
                      title="Delete moodboard"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Content box for moodboard */}
          {isAdmin && !moodboard.isLocked ? (
            <div className="mb-2">
              <textarea
                defaultValue={moodboard.content}
                placeholder="Add notes for this concept..."
                rows={2}
                className="w-full text-xs sm:text-sm text-zinc-700 bg-white border border-zinc-200 rounded-lg px-3 py-2 resize-none outline-none focus:border-zinc-400"
                onBlur={(e) => {
                  if (e.target.value !== moodboard.content) {
                    handleSaveContent(moodboard.id, e.target.value);
                  }
                }}
              />
              {savingContent === moodboard.id && (
                <p className="text-xs text-zinc-400 mt-1">Saving...</p>
              )}
            </div>
          ) : moodboard.content ? (
            <div className="mb-2 text-xs sm:text-sm text-zinc-600 bg-zinc-50 rounded-lg px-3 py-2 whitespace-pre-wrap">
              {moodboard.content}
            </div>
          ) : null}

          <MoodboardCanvas
            stepId={stepId}
            moodboardId={moodboard.id}
            assets={moodboard.assets}
            isAdmin={isAdmin && !moodboard.isLocked}
          />
        </div>
      ))}

      {/* Empty state - show Concept 1 with upload */}
      {hasNoMoodboards && !hasUnassigned && (
        <div>
          <div className="flex items-center justify-between mb-2 gap-2">
            <h3 className="text-xs sm:text-sm font-medium text-zinc-700 flex items-center gap-2">
              Concept 1
              {concept1Locked && <Lock size={12} className="text-amber-500" />}
            </h3>
            {isAdmin && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConcept1Locked(!concept1Locked)}
                  className={`${concept1Locked ? "text-amber-500 hover:text-amber-600" : "text-zinc-400 hover:text-zinc-600"}`}
                  title={concept1Locked ? "Unlock moodboard" : "Lock moodboard"}
                >
                  {concept1Locked ? <Lock size={14} /> : <Unlock size={14} />}
                </button>
                {!concept1Locked && <ImageUploadForm stepId={stepId} />}
              </div>
            )}
          </div>
          <MoodboardCanvas
            stepId={stepId}
            assets={[]}
            isAdmin={isAdmin && !concept1Locked}
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

      {/* File upload zone */}
      {isAdmin && <FileUploadForm stepId={stepId} />}
    </div>
  );
}
