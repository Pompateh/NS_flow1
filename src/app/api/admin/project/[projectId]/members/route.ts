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

  if (action === "add") {
    const username = String(form.get("username") ?? "").trim();
    if (!username) return NextResponse.json({ error: "username_required" }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) return NextResponse.json({ error: "user_not_found" }, { status: 404 });

    await prisma.projectMember.upsert({
      where: { userId_projectId: { userId: user.id, projectId } },
      update: {},
      create: { userId: user.id, projectId },
    });

    return NextResponse.redirect(new URL(`/admin/project/${projectId}`, req.url));
  }

  if (action === "remove") {
    const memberId = String(form.get("memberId") ?? "").trim();
    if (!memberId) return NextResponse.json({ error: "memberId_required" }, { status: 400 });

    await prisma.projectMember.delete({ where: { id: memberId } });

    return NextResponse.redirect(new URL(`/admin/project/${projectId}`, req.url));
  }

  return NextResponse.json({ error: "invalid_action" }, { status: 400 });
}
