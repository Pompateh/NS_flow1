import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put, del } from "@vercel/blob";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ stepId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { stepId } = await params;
  const step = await prisma.step.findUnique({
    where: { id: stepId },
    select: { id: true, projectId: true },
  });
  if (!step) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const form = await req.formData();

  const methodOverride = String(form.get("_method") ?? "").toLowerCase();
  if (methodOverride === "delete") {
    const url = new URL(req.url);
    const assetId = url.searchParams.get("assetId") ?? "";
    if (!assetId) return NextResponse.json({ error: "assetId_required" }, { status: 400 });

    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      select: { id: true, url: true, stepId: true },
    });

    if (!asset || asset.stepId !== stepId) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    await prisma.asset.delete({ where: { id: assetId } });

    try {
      await del(asset.url);
    } catch {
      // ignore blob delete errors
    }

    return NextResponse.redirect(new URL(`/project/${step.projectId}/step/${stepId}`, req.url));
  }

  const type = String(form.get("type") ?? "");
  const moodboardId = form.get("moodboardId") ? String(form.get("moodboardId")) : null;

  if (type !== "IMAGE" && type !== "FILE") {
    return NextResponse.json({ error: "invalid_type" }, { status: 400 });
  }

  const files = form.getAll("files");
  const singleFile = form.get("file");

  const filesToUpload: File[] = [];

  for (const f of files) {
    if (f instanceof File && f.size > 0) filesToUpload.push(f);
  }

  if (singleFile instanceof File && singleFile.size > 0) {
    filesToUpload.push(singleFile);
  }

  if (filesToUpload.length === 0) {
    return NextResponse.json({ error: "file_required" }, { status: 400 });
  }

  // Canvas dimensions (matching MoodboardCanvas)
  const CANVAS_WIDTH = 1400;
  const CANVAS_HEIGHT = 650; // Must match MoodboardCanvas
  const GRID_SIZE = 50;

  // Get current max zIndex for this step
  const maxZAsset = await prisma.asset.findFirst({
    where: { stepId, type: "IMAGE" },
    orderBy: { zIndex: "desc" },
    select: { zIndex: true },
  });
  let currentZIndex = (maxZAsset?.zIndex ?? 0) + 1;

  for (let i = 0; i < filesToUpload.length; i++) {
    const file = filesToUpload[i];
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    });

    // Random position snapped to grid
    // Smaller default size to fit reduced canvas height (660px)
    const defaultWidth = 150;
    const defaultHeight = 100;
    const maxGridX = Math.floor((CANVAS_WIDTH - defaultWidth) / GRID_SIZE);
    const maxGridY = Math.floor((CANVAS_HEIGHT - defaultHeight) / GRID_SIZE);
    const positionX = Math.floor(Math.random() * maxGridX) * GRID_SIZE;
    const positionY = Math.floor(Math.random() * maxGridY) * GRID_SIZE;

    await prisma.asset.create({
      data: {
        stepId,
        moodboardId,
        type,
        url: blob.url,
        filename: file.name,
        positionX,
        positionY,
        width: defaultWidth,
        height: defaultHeight,
        zIndex: currentZIndex + i,
      },
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ stepId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { stepId } = await params;
  const url = new URL(req.url);
  const assetId = url.searchParams.get("assetId") ?? "";
  if (!assetId) return NextResponse.json({ error: "assetId_required" }, { status: 400 });

  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    select: { id: true, url: true, stepId: true },
  });

  if (!asset || asset.stepId !== stepId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.asset.delete({ where: { id: assetId } });

  try {
    await del(asset.url);
  } catch {
    // ignore blob delete errors
  }

  return NextResponse.json({ ok: true });
}
