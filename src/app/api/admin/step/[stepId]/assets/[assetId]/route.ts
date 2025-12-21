import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { del } from "@vercel/blob";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ stepId: string; assetId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { stepId, assetId } = await params;

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
