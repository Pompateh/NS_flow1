import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string; stepId: string }> }
) {
  const { projectId, stepId } = await params;
  const clientCode = req.headers.get("x-client-code");

  if (!clientCode) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify client has access to this project
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, clientCode: true, clientName: true },
  });

  if (!project || project.clientCode !== clientCode) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get step with moodboards and assets
  const step = await prisma.step.findFirst({
    where: { id: stepId, projectId },
    select: {
      id: true,
      title: true,
      content: true,
      moodboards: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          name: true,
          content: true,
          assets: {
            where: { type: "IMAGE" },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              url: true,
              filename: true,
              positionX: true,
              positionY: true,
              width: true,
              height: true,
              zIndex: true,
              description: true,
              showDescription: true,
            },
          },
        },
      },
      assets: {
        where: { moodboardId: null, type: "IMAGE" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          url: true,
          filename: true,
          positionX: true,
          positionY: true,
          width: true,
          height: true,
          zIndex: true,
          description: true,
          showDescription: true,
        },
      },
    },
  });

  if (!step) {
    return NextResponse.json({ error: "Step not found" }, { status: 404 });
  }

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

  // Transform assets
  const transformAsset = (a: {
    id: string;
    url: string;
    filename: string;
    positionX: number | null;
    positionY: number | null;
    width: number | null;
    height: number | null;
    zIndex: number | null;
    description: string | null;
    showDescription: boolean;
  }) => ({
    id: a.id,
    url: a.url,
    filename: a.filename,
    positionX: a.positionX ?? 0,
    positionY: a.positionY ?? 0,
    width: a.width ?? 150,
    height: a.height ?? 100,
    zIndex: a.zIndex ?? 1,
    description: a.description,
    showDescription: a.showDescription,
  });

  return NextResponse.json({
    project: {
      id: project.id,
      name: project.name,
      clientName: project.clientName,
    },
    step: {
      id: step.id,
      title: step.title,
      content: step.content,
      moodboards: step.moodboards.map((mb) => ({
        id: mb.id,
        name: mb.name,
        content: mb.content,
        assets: mb.assets.map(transformAsset),
      })),
      unassignedAssets: step.assets.map(transformAsset),
    },
    comments,
  });
}
