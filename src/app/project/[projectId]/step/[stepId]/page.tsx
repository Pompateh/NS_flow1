import Link from "next/link";
import { getRequiredSession } from "@/lib/session";
import { requireProjectAccess } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import ImageUploadForm from "@/app/_components/ImageUploadForm";
import MoodboardCanvas from "@/app/_components/MoodboardCanvas";
import FileList from "@/app/_components/FileList";

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
  const images = step.assets
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
      <div className="px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/project/${projectId}`} className="text-sm text-zinc-600 hover:text-zinc-900">
              ← {project.name}
            </Link>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
              {step.title}
            </h1>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-3">
              <ImageUploadForm stepId={stepId} />
            </div>
          )}
        </div>

        {/* Moodboard Canvas - Full Width */}
        <MoodboardCanvas
          stepId={stepId}
          assets={images}
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
