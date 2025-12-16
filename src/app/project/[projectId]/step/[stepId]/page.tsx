import Image from "next/image";
import Link from "next/link";
import { getRequiredSession } from "@/lib/session";
import { requireProjectAccess } from "@/lib/access";
import { prisma } from "@/lib/prisma";

export default async function StepDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; stepId: string }>;
}) {
  const { projectId, stepId } = await params;
  const session = await getRequiredSession();

  const project = await requireProjectAccess({
    projectId,
    userId: session.user!.id,
    role: session.user?.role,
  });

  const step = await prisma.step.findFirst({
    where: { id: stepId, projectId },
    select: {
      id: true,
      title: true,
      content: true,
      updatedAt: true,
      assets: {
        orderBy: { createdAt: "desc" },
        select: { id: true, type: true, url: true, filename: true, createdAt: true },
      },
    },
  });

  if (!step) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <Link href={`/project/${projectId}`} className="text-sm text-zinc-600 hover:text-zinc-900">
            ← Back
          </Link>
          <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
            Step not found.
          </div>
        </div>
      </div>
    );
  }

  type StepAsset = (typeof step.assets)[number];
  const images: StepAsset[] = step.assets.filter((a: StepAsset) => a.type === "IMAGE");
  const files: StepAsset[] = step.assets.filter((a: StepAsset) => a.type === "FILE");
  const isAdmin = session.user?.role === "ADMIN";

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="space-y-1">
          <Link href={`/project/${projectId}`} className="text-sm text-zinc-600 hover:text-zinc-900">
            ← {project.name}
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {step.title}
          </h1>
          <p className="text-sm text-zinc-600">Updated {step.updatedAt.toLocaleString()}</p>
        </div>

        <div className="mt-8 grid gap-6">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-zinc-900">Content</h2>
            <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
              {step.content || ""}
            </pre>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-zinc-900">Images</h2>
            {isAdmin ? (
              <form
                action={`/api/admin/step/${stepId}/assets`}
                method="post"
                encType="multipart/form-data"
                className="mt-4 flex flex-col gap-2 sm:flex-row"
              >
                <input type="hidden" name="type" value="IMAGE" />
                <input
                  type="file"
                  name="files"
                  accept="image/*"
                  multiple
                  required
                  className="h-10 flex-1 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="h-10 rounded-md bg-zinc-900 px-3 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  Upload images
                </button>
              </form>
            ) : null}
            {images.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-600">No images.</p>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {images.map((img: StepAsset) => (
                  <div key={img.id} className="overflow-hidden rounded-xl border border-zinc-200">
                    <div className="relative aspect-[4/3] bg-zinc-100">
                      <Image
                        src={img.url}
                        alt={img.filename}
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 400px, 100vw"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 p-3">
                      <p className="truncate text-sm font-medium text-zinc-900">{img.filename}</p>
                      <div className="flex items-center gap-3">
                        <a
                          href={img.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
                        >
                          Download
                        </a>
                        {isAdmin ? (
                          <form
                            action={`/api/admin/step/${stepId}/assets?assetId=${img.id}`}
                            method="post"
                          >
                            <input type="hidden" name="_method" value="delete" />
                            <button
                              type="submit"
                              className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
                            >
                              Delete
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-zinc-900">Files</h2>
            {isAdmin ? (
              <form
                action={`/api/admin/step/${stepId}/assets`}
                method="post"
                encType="multipart/form-data"
                className="mt-4 flex flex-col gap-2 sm:flex-row"
              >
                <input type="hidden" name="type" value="FILE" />
                <input
                  type="file"
                  name="file"
                  required
                  className="h-10 flex-1 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="h-10 rounded-md bg-zinc-900 px-3 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  Upload file
                </button>
              </form>
            ) : null}
            {files.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-600">No files.</p>
            ) : (
              <div className="mt-4 grid gap-2">
                {files.map((f: StepAsset) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900">{f.filename}</p>
                      <p className="text-xs text-zinc-500">
                        Added {f.createdAt.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                      >
                        Download
                      </a>
                      {isAdmin ? (
                        <form
                          action={`/api/admin/step/${stepId}/assets?assetId=${f.id}`}
                          method="post"
                        >
                          <input type="hidden" name="_method" value="delete" />
                          <button
                            type="submit"
                            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
                          >
                            Delete
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
