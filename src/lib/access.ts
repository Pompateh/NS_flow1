import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type Role = "ADMIN" | "MEMBER";

export async function requireProjectAccess(params: {
  projectId: string;
  userId: string;
  role?: Role;
}) {
  const { projectId, userId, role } = params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, status: true },
  });

  if (!project) notFound();

  if (role === "ADMIN") return project;

  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
    select: { id: true },
  });

  if (!membership) redirect("/dashboard");

  return project;
}
