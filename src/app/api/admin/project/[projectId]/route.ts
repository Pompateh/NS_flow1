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

  if (action === "update") {
    const name = String(form.get("name") ?? "").trim();

    if (!name) {
      return NextResponse.json({ error: "name_required" }, { status: 400 });
    }

    await prisma.project.update({
      where: { id: projectId },
      data: { name },
    });

    return NextResponse.redirect(new URL(`/admin/project/${projectId}`, req.url));
  }

  return NextResponse.json({ error: "invalid_action" }, { status: 400 });
}
