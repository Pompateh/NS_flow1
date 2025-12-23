import Link from "next/link";
import { getRequiredSession } from "@/lib/session";
import { requireProjectAccess } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import FileList from "@/app/_components/FileList";
import StepContentForm from "@/app/_components/StepContentForm";
import MoodboardSection from "@/app/_components/MoodboardSection";
import CommentsIndicator from "@/app/_components/CommentsIndicator";

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

  // Get comments for this step
  const comments = await prisma.comment.findMany({
    where: { projectId, stepId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      content: true,
      author: true,
      createdAt: true,
    },
  });

  const step = await prisma.step.findFirst({
    where: { id: stepId, projectId },
    select: {
      id: true,
      title: true,
      content: true,
      updatedAt: true,
      moodboards: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          name: true,
          order: true,
          content: true,
          isLocked: true,
          assets: {
            where: { type: "IMAGE" },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              type: true,
              url: true,
              filename: true,
              createdAt: true,
              positionX: true,
              positionY: true,
              width: true,
              height: true,
              rotation: true,
              zIndex: true,
              description: true,
              showDescription: true,
            },
          },
        },
      },
      assets: {
        where: { moodboardId: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          type: true,
          url: true,
          filename: true,
          createdAt: true,
          positionX: true,
          positionY: true,
          width: true,
          height: true,
          rotation: true,
          zIndex: true,
          description: true,
          showDescription: true,
        },
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
  type MoodboardType = (typeof step.moodboards)[number];

  // Transform moodboards with their assets
  const moodboards = step.moodboards.map((mb: MoodboardType) => ({
    id: mb.id,
    name: mb.name,
    order: mb.order,
    content: mb.content,
    isLocked: mb.isLocked,
    assets: mb.assets.map((a) => ({
      id: a.id,
      url: a.url,
      filename: a.filename,
      positionX: a.positionX ?? 0,
      positionY: a.positionY ?? 0,
      width: a.width ?? 150,
      height: a.height ?? 100,
      rotation: a.rotation ?? 0,
      zIndex: a.zIndex ?? 1,
      description: a.description,
      showDescription: a.showDescription ?? false,
    })),
  }));

  // Unassigned images (not in any moodboard)
  const unassignedAssets = step.assets
    .filter((a: StepAsset) => a.type === "IMAGE")
    .map((a: StepAsset) => ({
      id: a.id,
      url: a.url,
      filename: a.filename,
      positionX: a.positionX ?? 0,
      positionY: a.positionY ?? 0,
      width: a.width ?? 150,
      height: a.height ?? 100,
      rotation: a.rotation ?? 0,
      zIndex: a.zIndex ?? 1,
      description: a.description,
      showDescription: a.showDescription ?? false,
    }));

  const files: StepAsset[] = step.assets.filter((a: StepAsset) => a.type === "FILE");
  const isAdmin = session.user?.role === "ADMIN";

  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="px-3 sm:px-4 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <Link href={`/project/${projectId}`} className="text-sm text-zinc-600 hover:text-zinc-900">
              ← {project.name}
            </Link>
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-zinc-900">
              {step.title}
            </h1>
          </div>
          {comments.length > 0 && (
            <CommentsIndicator comments={comments} />
          )}
        </div>

        {/* Content Section */}
        {(isAdmin || step.content) && (
          <section className="mb-3 sm:mb-4">
            {isAdmin ? (
              <StepContentForm
                projectId={projectId}
                stepId={stepId}
                initialTitle={step.title}
                initialContent={step.content || ""}
              />
            ) : (
              step.content && (
                <pre className="whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                  {step.content}
                </pre>
              )
            )}
          </section>
        )}

        {/* Separator Line */}
        <hr className="border-zinc-300 mb-3 sm:mb-4" />

        {/* Moodboard Section */}
        <MoodboardSection
          stepId={stepId}
          moodboards={moodboards}
          unassignedAssets={unassignedAssets}
          isAdmin={isAdmin}
        />

        {/* Files Section - Only show if there are files */}
        {files.length > 0 && (
          <FileList files={files} stepId={stepId} isAdmin={isAdmin} />
        )}
      </div>
    </div>
  );
}
