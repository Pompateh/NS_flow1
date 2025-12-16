"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FileUploadForm({ stepId }: { stepId: string }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setUploading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch(`/api/admin/step/${stepId}/assets`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }

      form.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
      <input type="hidden" name="type" value="FILE" />
      <input
        type="file"
        name="files"
        required
        disabled={uploading}
        className="h-10 flex-1 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={uploading}
        className="h-10 rounded-md bg-zinc-900 px-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Upload file"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
