import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const code = String(body.code ?? "").trim();

  if (!code) {
    return NextResponse.json({ error: "Code required" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { clientCode: code },
    select: { id: true, name: true, clientName: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Invalid code" }, { status: 404 });
  }

  return NextResponse.json({ 
    projectId: project.id,
    projectName: project.name,
    clientName: project.clientName,
  });
}
