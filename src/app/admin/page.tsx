import Link from "next/link";
import { getRequiredSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const session = await getRequiredSession();

  if (session.user?.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-zinc-50">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
            Not allowed.
          </div>
        </div>
      </div>
    );
  }

  const projects: Array<{ id: string; name: string; status: string; updatedAt: Date }> =
    await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, status: true, updatedAt: true },
  });

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link href="/dashboard" className="text-sm text-zinc-600 hover:text-zinc-900">
              ← Back
            </Link>
            <h1 className="mt-2 text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900">Admin</h1>
            <p className="text-sm text-zinc-600">Manage projects (v1 minimal).</p>
          </div>

          <form action="/api/admin/projects" method="post" className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                name="name"
                required
                placeholder="Project name"
                className="h-10 w-full sm:w-48 rounded-md border border-zinc-200 bg-white px-3 text-sm"
              />
              <input
                name="clientName"
                placeholder="Client name"
                className="h-10 w-full sm:w-36 rounded-md border border-zinc-200 bg-white px-3 text-sm"
              />
              <input
                name="clientCode"
                placeholder="Client code"
                className="h-10 w-full sm:w-32 rounded-md border border-zinc-200 bg-white px-3 text-sm"
              />
              <button
                type="submit"
                className="h-10 rounded-md bg-zinc-900 px-3 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Create
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 sm:mt-8 grid gap-3">
          {projects.map((p: (typeof projects)[number]) => (
            <div key={p.id} className="rounded-xl border border-zinc-200 bg-white p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm sm:text-base font-medium text-zinc-900">{p.name}</p>
                  <p className="text-xs text-zinc-500">
                    {p.status} • Updated {p.updatedAt.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/project/${p.id}`}
                    className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
                  >
                    View
                  </Link>
                  <Link
                    href={`/admin/project/${p.id}`}
                    className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                  >
                    Manage
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {projects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-8 text-sm text-zinc-600">
              No projects.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
