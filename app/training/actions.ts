"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function addTrainingType(formData: FormData) {
  const name = formData.get("name")?.toString().trim();
  if (!name) {
    throw new Error("Group name is required.");
  }

  const { error } = await supabaseAdmin.from("training_types").insert({ name });
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/training");
}

export async function deleteTrainingType(id: string) {
  const { error } = await supabaseAdmin.from("training_types").delete().eq("id", id);
  if (error) {
    throw new Error("Cannot delete this group: passes or calendar sessions may be attached to it.");
  }

  revalidatePath("/training");
}
