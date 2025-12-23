import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const clientCode = req.headers.get("x-client-code");

  if (!clientCode) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      clientCode: true,
      clientName: true,
      steps: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          order: true,
        },
      },
    },
  });

  if (!project || project.clientCode !== clientCode) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    project: {
      id: project.id,
      name: project.name,
      clientName: project.clientName,
      steps: project.steps,
    },
  });
}
