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

  for (const file of filesToUpload) {
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    });

    await prisma.asset.create({
      data: {
        stepId,
        type,
        url: blob.url,
        filename: file.name,
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
