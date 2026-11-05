"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function addMember(formData: FormData) {
  const first_name = formData.get("first_name") as string;
  const last_name = formData.get("last_name") as string;

  await supabaseAdmin.from("members").insert({ first_name, last_name });
  revalidatePath("/");
}

export async function deleteMember(id: string) {
  await supabaseAdmin.from("members").delete().eq("id", id);
  revalidatePath("/");
}
