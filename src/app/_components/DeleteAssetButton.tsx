"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteAssetButton({
  stepId,
  assetId,
}: {
  stepId: string;
  assetId: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this asset?")) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/admin/step/${stepId}/assets?assetId=${assetId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Delete failed");
      }

      router.refresh();
    } catch {
      alert("Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-sm font-medium text-zinc-700 hover:text-zinc-900 disabled:opacity-50"
    >
      {deleting ? "..." : "Delete"}
    </button>
  );
}
