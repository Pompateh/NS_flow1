import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export async function getRequiredSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  return session;
}
