import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
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
    select: { id: true, stepId: true },
  });

  if (!asset || asset.stepId !== stepId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const body = await req.json();

  // Only allow updating moodboard-related fields
  const allowedFields = [
    "positionX",
    "positionY",
    "width",
    "height",
    "rotation",
    "zIndex",
    "description",
    "showDescription",
  ];

  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "no_valid_fields" }, { status: 400 });
  }

  const updated = await prisma.asset.update({
    where: { id: assetId },
    data: updates,
  });

  return NextResponse.json({ ok: true, asset: updated });
}
