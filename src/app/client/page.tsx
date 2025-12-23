"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ClientLoginPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/client/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid code");
      }

      // Store client session in cookie/localStorage and redirect
      localStorage.setItem("clientCode", code.trim());
      router.push(`/client/project/${data.projectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900">
              Client Access
            </h1>
            <p className="text-sm text-zinc-600">
              Enter your project code to view your project.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-900" htmlFor="code">
                Project Code
              </label>
              <input
                id="code"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter your code"
                className="h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-0 focus:border-zinc-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-md bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Access Project"}
            </button>

            {error && (
              <p className="text-sm text-red-600" aria-live="polite">
                {error}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
