import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET all moodboards for a step
export async function GET(
  req: Request,
  { params }: { params: Promise<{ stepId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { stepId } = await params;

  const moodboards = await prisma.moodboard.findMany({
    where: { stepId },
    orderBy: { order: "asc" },
    include: {
      assets: {
        where: { type: "IMAGE" },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return NextResponse.json({ moodboards });
}

// POST create new moodboard
export async function POST(
  req: Request,
  { params }: { params: Promise<{ stepId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { stepId } = await params;

  // Get current max order
  const maxOrder = await prisma.moodboard.findFirst({
    where: { stepId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const newOrder = (maxOrder?.order ?? -1) + 1;

  // Concept 1 is always the unassigned assets, so new moodboards start at Concept 2
  const moodboard = await prisma.moodboard.create({
    data: {
      stepId,
      name: `Concept ${newOrder + 2}`,
      order: newOrder,
    },
  });

  return NextResponse.json({ ok: true, moodboard });
}
