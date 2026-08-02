"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyPin } from "@/admin/auth/pin";
import { ADMIN_SESSION_COOKIE, createAdminSessionToken } from "@/admin/auth/session";

export interface LoginState {
  error?: string;
}

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const pin = formData.get("pin");
  const storedHash = process.env.ADMIN_PIN_HASH;

  if (typeof pin !== "string" || pin.length === 0) {
    return { error: "Enter the admin PIN." };
  }
  if (!storedHash) {
    return { error: "ADMIN_PIN_HASH is not configured on the server." };
  }

  const isValid = await verifyPin(pin, storedHash);
  if (!isValid) {
    return { error: "Incorrect PIN." };
  }

  const token = await createAdminSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  redirect("/admin");
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  redirect("/admin/login");
}
