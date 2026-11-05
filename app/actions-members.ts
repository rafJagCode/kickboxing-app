// app/actions-members.ts
"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function addMember(formData: FormData) {
  const first_name = formData.get("first_name")?.toString().trim();
  const last_name = formData.get("last_name")?.toString().trim();

  if (!first_name || !last_name) {
    throw new Error("Both First Name and Last Name are required.");
  }

  const { error } = await supabaseAdmin.from("members").insert({
    first_name,
    last_name,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
}

export async function deleteMember(id: string) {
  const { error } = await supabaseAdmin.from("members").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
}
