"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StepContentForm({
  projectId,
  stepId,
  initialTitle,
  initialContent,
}: {
  projectId: string;
  stepId: string;
  initialTitle: string;
  initialContent: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch(`/api/admin/project/${projectId}/steps`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Save failed");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <input type="hidden" name="action" value="update" />
      <input type="hidden" name="stepId" value={stepId} />
      <input type="hidden" name="title" value={initialTitle} />
      <div className="grid gap-1">
        <div className="relative">
          <textarea
            name="content"
            defaultValue={initialContent}
            rows={4}
            disabled={saving}
            className="w-full border-none bg-transparent px-0 py-0 text-sm text-zinc-900 disabled:opacity-50 resize-none outline-none"
            placeholder="Add content..."
          />
        </div>
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="text-xs text-zinc-500 hover:text-zinc-900 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
      </div>
    </form>
  );
}
