"use server";

import { createSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export type ActionState = {
  error?: string;
};

export async function loginAction(_prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const password = formData.get("password");
  const masterPassword = process.env.APP_PASSWORD;

  if (!masterPassword) {
    return { error: "Server misconfiguration: APP_PASSWORD is not set." };
  }

  if (typeof password !== "string" || password.trim() === "") {
    return { error: "Please enter the password." };
  }

  if (password !== masterPassword) {
    return { error: "Invalid password. Access denied." };
  }

  await createSession();
  redirect("/");
}
