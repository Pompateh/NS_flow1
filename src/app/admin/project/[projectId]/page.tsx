import Link from "next/link";
import { getRequiredSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function AdminProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
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

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      status: true,
      clientCode: true,
      clientName: true,
      updatedAt: true,
      steps: {
        orderBy: { order: "asc" },
        select: { id: true, title: true, content: true, order: true, updatedAt: true },
      },
    },
  });

  if (!project) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <Link href="/admin" className="text-sm text-zinc-600 hover:text-zinc-900">
            ← Back
          </Link>
          <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
            Project not found.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
          <div className="space-y-1">
            <Link href="/admin" className="text-sm text-zinc-600 hover:text-zinc-900">
              ← Admin
            </Link>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900">
              Manage: {project.name}
            </h1>
            <p className="text-sm text-zinc-600">
              {project.status} • Updated {project.updatedAt.toLocaleString()}
            </p>
          </div>
          <Link
            href={`/project/${projectId}`}
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
          >
            View as user
          </Link>
        </div>

        {/* Project Settings */}
        <section className="mt-6 sm:mt-8 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-zinc-900">Project Settings</h2>
          <form
            action={`/api/admin/project/${projectId}`}
            method="post"
            className="mt-4 space-y-4"
          >
            <input type="hidden" name="action" value="update" />
            <div className="grid gap-2">
              <label className="text-xs font-medium text-zinc-700">Project Name</label>
              <input
                name="name"
                defaultValue={project.name}
                required
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
                placeholder="Project name"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-xs font-medium text-zinc-700">Client Name</label>
                <input
                  name="clientName"
                  defaultValue={project.clientName || ""}
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
                  placeholder="Client name"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-medium text-zinc-700">Client Access Code</label>
                <input
                  name="clientCode"
                  defaultValue={project.clientCode || ""}
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
                  placeholder="Unique code for client login"
                />
              </div>
            </div>
            {project.clientCode && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                <p className="text-xs text-blue-800">
                  <strong>Client Login URL:</strong> /client
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Client enters code: <strong>{project.clientCode}</strong>
                </p>
              </div>
            )}
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Save Settings
            </button>
          </form>
        </section>

        <div className="mt-6 sm:mt-8 grid gap-4 sm:gap-6">
          <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900">Steps</h2>
              <form action={`/api/admin/project/${projectId}/steps`} method="post">
                <input type="hidden" name="action" value="create" />
                <button
                  type="submit"
                  className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  Add step
                </button>
              </form>
            </div>

            <div className="mt-4 grid gap-3">
              {project.steps.map((s: (typeof project.steps)[number]) => (
                <div key={s.id} className="rounded-xl border border-zinc-200 p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-zinc-500">Step {s.order}</p>
                      <Link
                        href={`/project/${projectId}/step/${s.id}`}
                        className="text-base font-medium text-zinc-900 hover:underline"
                      >
                        {s.title}
                      </Link>
                      <p className="text-xs text-zinc-500">Updated {s.updatedAt.toLocaleString()}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <form action={`/api/admin/project/${projectId}/steps`} method="post">
                        <input type="hidden" name="action" value="move" />
                        <input type="hidden" name="stepId" value={s.id} />
                        <input type="hidden" name="direction" value="up" />
                        <button
                          type="submit"
                          className="rounded-md border border-zinc-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-zinc-900 hover:bg-zinc-50"
                        >
                          Up
                        </button>
                      </form>
                      <form action={`/api/admin/project/${projectId}/steps`} method="post">
                        <input type="hidden" name="action" value="move" />
                        <input type="hidden" name="stepId" value={s.id} />
                        <input type="hidden" name="direction" value="down" />
                        <button
                          type="submit"
                          className="rounded-md border border-zinc-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-zinc-900 hover:bg-zinc-50"
                        >
                          Down
                        </button>
                      </form>
                      <form action={`/api/admin/project/${projectId}/steps`} method="post">
                        <input type="hidden" name="action" value="delete" />
                        <input type="hidden" name="stepId" value={s.id} />
                        <button
                          type="submit"
                          className="rounded-md border border-zinc-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-zinc-900 hover:bg-zinc-50"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>

                  <form
                    action={`/api/admin/project/${projectId}/steps`}
                    method="post"
                    className="mt-4 grid gap-3"
                  >
                    <input type="hidden" name="action" value="update" />
                    <input type="hidden" name="stepId" value={s.id} />
                    <div className="grid gap-2">
                      <label className="text-xs font-medium text-zinc-700">Title</label>
                      <input
                        name="title"
                        defaultValue={s.title}
                        className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-xs font-medium text-zinc-700">Content</label>
                      <textarea
                        name="content"
                        defaultValue={s.content}
                        rows={4}
                        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                </div>
              ))}

              {project.steps.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-8 text-sm text-zinc-600">
                  No steps.
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
