import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH update moodboard name
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ stepId: string; moodboardId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { stepId, moodboardId } = await params;
  const body = await req.json();

  const moodboard = await prisma.moodboard.findUnique({
    where: { id: moodboardId },
    select: { id: true, stepId: true },
  });

  if (!moodboard || moodboard.stepId !== stepId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const updated = await prisma.moodboard.update({
    where: { id: moodboardId },
    data: { name: body.name },
  });

  return NextResponse.json({ ok: true, moodboard: updated });
}

// DELETE moodboard
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ stepId: string; moodboardId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { stepId, moodboardId } = await params;

  const moodboard = await prisma.moodboard.findUnique({
    where: { id: moodboardId },
    select: { id: true, stepId: true },
  });

  if (!moodboard || moodboard.stepId !== stepId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Get all assets in this moodboard to delete their blobs
  const assets = await prisma.asset.findMany({
    where: { moodboardId },
    select: { id: true, url: true },
  });

  // Delete assets from database
  await prisma.asset.deleteMany({
    where: { moodboardId },
  });

  // Delete the moodboard
  await prisma.moodboard.delete({ where: { id: moodboardId } });

  // Delete blobs (fire and forget)
  const { del } = await import("@vercel/blob");
  for (const asset of assets) {
    try {
      await del(asset.url);
    } catch {
      // ignore blob delete errors
    }
  }

  return NextResponse.json({ ok: true });
}
