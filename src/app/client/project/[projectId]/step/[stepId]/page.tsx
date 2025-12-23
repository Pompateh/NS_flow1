"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface MoodboardAsset {
  id: string;
  url: string;
  filename: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  description: string | null;
  showDescription: boolean;
  zIndex: number;
}

interface Moodboard {
  id: string;
  name: string;
  content: string;
  assets: MoodboardAsset[];
}

interface Comment {
  id: string;
  content: string;
  author: string;
  createdAt: string;
}

interface Step {
  id: string;
  title: string;
  content: string;
  moodboards: Moodboard[];
  unassignedAssets: MoodboardAsset[];
}

interface Project {
  id: string;
  name: string;
  clientName: string | null;
}

export default function ClientStepPage({
  params,
}: {
  params: Promise<{ projectId: string; stepId: string }>;
}) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [step, setStep] = useState<Step | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { projectId, stepId } = await params;
      const clientCode = localStorage.getItem("clientCode");

      if (!clientCode) {
        router.push("/client");
        return;
      }

      try {
        const res = await fetch(`/api/client/project/${projectId}/step/${stepId}`, {
          headers: { "x-client-code": clientCode },
        });

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("clientCode");
            router.push("/client");
            return;
          }
          throw new Error("Failed to load step");
        }

        const data = await res.json();
        setProject(data.project);
        setStep(data.step);
        setComments(data.comments || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load step");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params, router]);

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || !project || !step) return;

    const { projectId, stepId } = await params;
    const clientCode = localStorage.getItem("clientCode");
    if (!clientCode) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/client/project/${projectId}/step/${stepId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-client-code": clientCode,
        },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [data.comment, ...prev]);
        setNewComment("");
      }
    } catch (err) {
      console.error("Failed to submit comment:", err);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-sm text-zinc-600">Loading...</p>
      </div>
    );
  }

  if (error || !project || !step) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-zinc-600">{error || "Step not found"}</p>
          <Link href="/client" className="mt-4 text-sm text-blue-600 hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  const CANVAS_WIDTH = 1400;
  const CANVAS_HEIGHT = 650;

  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="px-3 sm:px-4 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href={`/client/project/${project.id}`}
              className="text-sm text-zinc-600 hover:text-zinc-900"
            >
              ← {project.name}
            </Link>
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-zinc-900">
              {step.title}
            </h1>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("clientCode");
              router.push("/client");
            }}
            className="text-sm text-zinc-600 hover:text-zinc-900"
          >
            Sign out
          </button>
        </div>

        {/* Content */}
        {step.content && (
          <section className="mb-4 rounded-xl border border-zinc-200 bg-white p-3 sm:p-4">
            <p className="text-sm text-zinc-700 whitespace-pre-wrap">{step.content}</p>
          </section>
        )}

        {/* Moodboards - View Only */}
        <section className="space-y-4 sm:space-y-6">
          {/* Concept 1 - Unassigned assets */}
          {step.unassignedAssets.length > 0 && (
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-zinc-700 mb-2">Concept 1</h3>
              <div
                className="relative w-full overflow-hidden rounded-lg border-2 border-zinc-300 bg-white shadow-lg"
                style={{ aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}` }}
              >
                {step.unassignedAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="absolute"
                    style={{
                      left: `${(asset.positionX / CANVAS_WIDTH) * 100}%`,
                      top: `${(asset.positionY / CANVAS_HEIGHT) * 100}%`,
                      width: `${(asset.width / CANVAS_WIDTH) * 100}%`,
                      height: `${(asset.height / CANVAS_HEIGHT) * 100}%`,
                      zIndex: asset.zIndex,
                    }}
                  >
                    <div className="relative h-full overflow-hidden border-2 border-transparent bg-zinc-100">
                      <Image
                        src={asset.url}
                        alt={asset.filename}
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="100%"
                      />
                      {asset.showDescription && asset.description && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1.5 backdrop-blur-sm">
                          <p className="text-xs text-white/90">{asset.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Named moodboards */}
          {step.moodboards.map((moodboard, index) => (
            <div key={moodboard.id}>
              <h3 className="text-xs sm:text-sm font-medium text-zinc-700 mb-2">
                Concept {index + 2}
              </h3>
              {moodboard.content && (
                <div className="mb-2 text-xs sm:text-sm text-zinc-600 bg-zinc-50 rounded-lg px-3 py-2 whitespace-pre-wrap">
                  {moodboard.content}
                </div>
              )}
              <div
                className="relative w-full overflow-hidden rounded-lg border-2 border-zinc-300 bg-white shadow-lg"
                style={{ aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}` }}
              >
                {moodboard.assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="absolute"
                    style={{
                      left: `${(asset.positionX / CANVAS_WIDTH) * 100}%`,
                      top: `${(asset.positionY / CANVAS_HEIGHT) * 100}%`,
                      width: `${(asset.width / CANVAS_WIDTH) * 100}%`,
                      height: `${(asset.height / CANVAS_HEIGHT) * 100}%`,
                      zIndex: asset.zIndex,
                    }}
                  >
                    <div className="relative h-full overflow-hidden border-2 border-transparent bg-zinc-100">
                      <Image
                        src={asset.url}
                        alt={asset.filename}
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="100%"
                      />
                      {asset.showDescription && asset.description && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1.5 backdrop-blur-sm">
                          <p className="text-xs text-white/90">{asset.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Comments Section */}
        <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-3 sm:p-4">
          <h2 className="text-sm font-semibold text-zinc-900 mb-4">Comments</h2>

          {/* Comment Form */}
          <form onSubmit={handleSubmitComment} className="mb-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
              className="w-full text-sm text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 resize-none outline-none focus:border-zinc-400"
            />
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="mt-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {submitting ? "Posting..." : "Post Comment"}
            </button>
          </form>

          {/* Comments List */}
          <div className="space-y-3">
            {comments.length === 0 ? (
              <p className="text-sm text-zinc-500">No comments yet.</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="border-t border-zinc-100 pt-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-zinc-900">{comment.author}</span>
                    <span className="text-xs text-zinc-500">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-700 whitespace-pre-wrap">{comment.content}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
