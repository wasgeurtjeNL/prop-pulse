"use server";

import { auth } from "@/lib/auth"; // Your auth provider
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import prisma from "../prisma";

export async function switchUserRole() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) throw new Error("Unauthorized");

  const newRole = session.user.role === "AGENT" ? "USER" : "AGENT";

  await prisma.user.update({
    where: { id: session.user.id },
    data: { role: newRole },
  });

  revalidatePath("/");
}
