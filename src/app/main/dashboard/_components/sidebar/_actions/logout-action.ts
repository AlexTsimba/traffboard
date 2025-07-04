"use server";

import { signOut } from "../../../../../../../auth";

export async function logoutAction() {
  await signOut({ redirectTo: "/main/auth/v1/login" });
}
