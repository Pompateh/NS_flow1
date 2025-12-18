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
      <div className="grid gap-2">
        <label className="text-xs font-medium text-zinc-700">Title</label>
        <input
          name="title"
          defaultValue={initialTitle}
          disabled={saving}
          className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm disabled:opacity-50"
        />
      </div>
      <div className="grid gap-2">
        <label className="text-xs font-medium text-zinc-700">Content</label>
        <textarea
          name="content"
          defaultValue={initialContent}
          rows={6}
          disabled={saving}
          className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
        />
      </div>
      <div className="flex items-center justify-between">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="ml-auto rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
