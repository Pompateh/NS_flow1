import Link from "next/link";
import { getRequiredSession } from "@/lib/session";
import { requireProjectAccess } from "@/lib/access";
import { prisma } from "@/lib/prisma";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await getRequiredSession();

  const project = await requireProjectAccess({
    projectId,
    userId: session.user!.id,
    role: session.user?.role,
  });

  const steps: Array<{ id: string; title: string; updatedAt: Date; order: number }> =
    await prisma.step.findMany({
    where: { projectId },
    orderBy: { order: "asc" },
    select: { id: true, title: true, updatedAt: true, order: true },
  });

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Link href="/dashboard" className="text-sm text-zinc-600 hover:text-zinc-900">
              ← Back
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              {project.name}
            </h1>
            <p className="text-sm text-zinc-600">Status: {project.status}</p>
          </div>

          {session.user?.role === "ADMIN" ? (
            <Link
              href={`/admin/project/${projectId}`}
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
            >
              Manage
            </Link>
          ) : null}
        </div>

        <div className="mt-8 grid gap-3">
          {steps.map((s: (typeof steps)[number]) => (
            <Link
              key={s.id}
              href={`/project/${projectId}/step/${s.id}`}
              className="group rounded-xl border border-zinc-200 bg-white p-4 hover:border-zinc-300"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500">Step {s.order}</p>
                  <p className="text-base font-medium text-zinc-900 group-hover:underline">
                    {s.title}
                  </p>
                </div>
                <p className="text-xs text-zinc-500">
                  Updated {s.updatedAt.toLocaleString()}
                </p>
              </div>
            </Link>
          ))}

          {steps.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-8 text-sm text-zinc-600">
              No steps yet.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
