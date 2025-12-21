import Link from "next/link";
import { SignOutButton } from "@/app/_components/SignOutButton";
import { getRequiredSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await getRequiredSession();

  const projects: Array<{ id: string; name: string; status: string; updatedAt: Date }> =
    session.user?.role === "ADMIN"
      ? await prisma.project.findMany({
          orderBy: { updatedAt: "desc" },
          select: { id: true, name: true, status: true, updatedAt: true },
        })
      : await prisma.project.findMany({
          where: { members: { some: { userId: session.user!.id } } },
          orderBy: { updatedAt: "desc" },
          select: { id: true, name: true, status: true, updatedAt: true },
        });

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900">
              Dashboard
            </h1>
            <p className="text-sm text-zinc-600">
              Signed in as {session?.user?.name} ({session?.user?.role})
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {session?.user?.role === "ADMIN" ? (
              <Link
                href="/admin"
                className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
              >
                Admin
              </Link>
            ) : null}

            <SignOutButton />
          </div>
        </div>

        <div className="mt-6 sm:mt-8 grid gap-3">
          {projects.map((p: (typeof projects)[number]) => (
            <Link
              key={p.id}
              href={`/project/${p.id}`}
              className="group rounded-xl border border-zinc-200 bg-white p-4 hover:border-zinc-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-base font-medium text-zinc-900 group-hover:underline">
                    {p.name}
                  </p>
                  <p className="text-xs text-zinc-500">{p.status}</p>
                </div>
                <p className="text-xs text-zinc-500">Updated {p.updatedAt.toLocaleString()}</p>
              </div>
            </Link>
          ))}

          {projects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-8 text-sm text-zinc-600">
              No projects assigned.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
