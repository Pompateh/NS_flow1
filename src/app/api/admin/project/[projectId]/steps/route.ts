import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { projectId } = await params;
  const form = await req.formData();
  const action = String(form.get("action") ?? "");

  if (action === "create") {
    const maxOrder = await prisma.step.aggregate({
      where: { projectId },
      _max: { order: true },
    });

    const order = (maxOrder._max.order ?? 0) + 1;

    const step = await prisma.step.create({
      data: {
        projectId,
        title: `Step ${order}`,
        content: "",
        order,
      },
      select: { id: true },
    });

    return NextResponse.redirect(new URL(`/admin/project/${projectId}`, req.url));
  }

  if (action === "update") {
    const stepId = String(form.get("stepId") ?? "").trim();
    const title = String(form.get("title") ?? "");
    const content = String(form.get("content") ?? "");

    if (!stepId) return NextResponse.json({ error: "stepId_required" }, { status: 400 });

    await prisma.step.update({
      where: { id: stepId },
      data: { title, content },
    });

    return NextResponse.redirect(new URL(`/admin/project/${projectId}`, req.url));
  }

  if (action === "delete") {
    const stepId = String(form.get("stepId") ?? "").trim();
    if (!stepId) return NextResponse.json({ error: "stepId_required" }, { status: 400 });

    const step = await prisma.step.findUnique({
      where: { id: stepId },
      select: { id: true, order: true, projectId: true },
    });

    if (!step || step.projectId !== projectId) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.asset.deleteMany({ where: { stepId } }),
      prisma.step.delete({ where: { id: stepId } }),
      prisma.step.updateMany({
        where: { projectId, order: { gt: step.order } },
        data: { order: { decrement: 1 } },
      }),
    ]);

    return NextResponse.redirect(new URL(`/admin/project/${projectId}`, req.url));
  }

  if (action === "move") {
    const stepId = String(form.get("stepId") ?? "").trim();
    const direction = String(form.get("direction") ?? "");
    if (!stepId) return NextResponse.json({ error: "stepId_required" }, { status: 400 });
    if (direction !== "up" && direction !== "down") {
      return NextResponse.json({ error: "invalid_direction" }, { status: 400 });
    }

    const step = await prisma.step.findUnique({
      where: { id: stepId },
      select: { id: true, projectId: true, order: true },
    });

    if (!step || step.projectId !== projectId) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const neighbor = await prisma.step.findFirst({
      where: {
        projectId,
        order: direction === "up" ? step.order - 1 : step.order + 1,
      },
      select: { id: true, order: true },
    });

    if (!neighbor) {
      return NextResponse.redirect(new URL(`/admin/project/${projectId}`, req.url));
    }

    await prisma.$transaction([
      prisma.step.update({ where: { id: step.id }, data: { order: -1 } }),
      prisma.step.update({ where: { id: neighbor.id }, data: { order: step.order } }),
      prisma.step.update({ where: { id: step.id }, data: { order: neighbor.order } }),
    ]);

    return NextResponse.redirect(new URL(`/admin/project/${projectId}`, req.url));
  }

  return NextResponse.json({ error: "invalid_action" }, { status: 400 });
}
