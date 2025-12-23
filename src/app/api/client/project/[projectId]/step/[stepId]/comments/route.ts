import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
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
    select: { id: true, clientCode: true, clientName: true },
  });

  if (!project || project.clientCode !== clientCode) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const content = String(body.content ?? "").trim();

  if (!content) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      projectId,
      stepId,
      content,
      author: project.clientName || "Client",
    },
    select: {
      id: true,
      content: true,
      author: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ comment });
}
