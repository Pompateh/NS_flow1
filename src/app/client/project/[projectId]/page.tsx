"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Step {
  id: string;
  title: string;
  order: number;
}

interface Project {
  id: string;
  name: string;
  clientName: string | null;
  steps: Step[];
}

export default function ClientProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProject() {
      const { projectId } = await params;
      const clientCode = localStorage.getItem("clientCode");
      
      if (!clientCode) {
        router.push("/client");
        return;
      }

      try {
        const res = await fetch(`/api/client/project/${projectId}`, {
          headers: { "x-client-code": clientCode },
        });

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("clientCode");
            router.push("/client");
            return;
          }
          throw new Error("Failed to load project");
        }

        const data = await res.json();
        setProject(data.project);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load project");
      } finally {
        setLoading(false);
      }
    }

    loadProject();
  }, [params, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-sm text-zinc-600">Loading...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-zinc-600">{error || "Project not found"}</p>
          <Link href="/client" className="mt-4 text-sm text-blue-600 hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-sm text-zinc-600">
              Welcome{project.clientName ? `, ${project.clientName}` : ""}
            </p>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900">
              {project.name}
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

        <div className="grid gap-3">
          {project.steps.map((step) => (
            <Link
              key={step.id}
              href={`/client/project/${project.id}/step/${step.id}`}
              className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-zinc-300 transition-colors"
            >
              <p className="text-sm sm:text-base font-medium text-zinc-900">
                {step.title}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
