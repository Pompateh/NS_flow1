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

  if (!name) {
    return NextResponse.json({ error: "name_required" }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      name,
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

  return NextResponse.redirect(new URL(`/project/${project.id}`, req.url));
}
