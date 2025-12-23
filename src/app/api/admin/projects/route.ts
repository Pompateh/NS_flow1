import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const form = await req.formData();
  const name = String(form.get("name") ?? "").trim();
  const clientCode = String(form.get("clientCode") ?? "").trim() || null;
  const clientName = String(form.get("clientName") ?? "").trim() || null;

  if (!name) {
    return NextResponse.json({ error: "name_required" }, { status: 400 });
  }

  // Check if client code already exists
  if (clientCode) {
    const existing = await prisma.project.findUnique({
      where: { clientCode },
    });
    if (existing) {
      return NextResponse.redirect(new URL(`/admin?error=code_exists`, req.url));
    }
  }

  const project = await prisma.project.create({
    data: {
      name,
      clientCode,
      clientName,
      members: {
        create: {
          userId: session.user.id,
        },
      },
      steps: {
        create: [{ order: 1, title: "Step 1", content: "" }],
      },
    },
    select: { id: true },
  });

  return NextResponse.redirect(new URL(`/admin/project/${project.id}`, req.url));
}
