import bcryptjs from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { auth } from "../../auth";

export async function getSession() {
  return await auth();
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

export async function isAuthenticated() {
  const user = await getCurrentUser();
  return !!user;
}

export async function hasRole(role: string) {
  const user = await getCurrentUser();
  return user?.role === role;
}

export async function isSuperuser() {
  return await hasRole("superuser");
}

export async function hashPassword(password: string): Promise<string> {
  return await bcryptjs.hash(password, 12);
}

export async function createUser(email: string, password: string, name?: string, role = "user") {
  const passwordHash = await hashPassword(password);

  return await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role,
    },
  });
}