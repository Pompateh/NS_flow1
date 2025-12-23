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
    const clientName = String(form.get("clientName") ?? "").trim() || null;
    const clientCode = String(form.get("clientCode") ?? "").trim() || null;

    if (!name) {
      return NextResponse.json({ error: "name_required" }, { status: 400 });
    }

    // Check if client code is unique (if provided)
    if (clientCode) {
      const existing = await prisma.project.findFirst({
        where: { clientCode, id: { not: projectId } },
      });
      if (existing) {
        return NextResponse.redirect(new URL(`/admin/project/${projectId}?error=code_exists`, req.url));
      }
    }

    await prisma.project.update({
      where: { id: projectId },
      data: { name, clientName, clientCode },
    });

    return NextResponse.redirect(new URL(`/admin/project/${projectId}`, req.url));
  }

  return NextResponse.json({ error: "invalid_action" }, { status: 400 });
}
