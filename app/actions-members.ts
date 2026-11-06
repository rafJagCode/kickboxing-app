/*
 * Description: Server action to update existing member details (first name, last name).
 * Config: Revalidates root directory path and specific member detail route on completion.
 */
"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function addMember(formData: FormData) {
  const firstName = formData.get("first_name")?.toString().trim();
  const lastName = formData.get("last_name")?.toString().trim();

  if (!firstName || !lastName) {
    throw new Error("Both First Name and Last Name are required.");
  }

  const { data: newMember, error: memberError } = await supabaseAdmin
    .from("members")
    .insert({
      first_name: firstName,
      last_name: lastName,
    })
    .select()
    .single();

  if (memberError || !newMember) {
    throw new Error(`Failed to add member: ${memberError?.message}`);
  }

  const { data: defaultGroup } = await supabaseAdmin.from("training_types").select("id").order("name", { ascending: true }).limit(1).maybeSingle();

  if (defaultGroup) {
    const todayISO = new Date().toISOString().split("T")[0];
    await supabaseAdmin.from("passes").insert({
      member_id: newMember.id,
      training_type_id: defaultGroup.id,
      start_date: todayISO,
      total_entries: 0,
      is_active: true,
    });
  }

  revalidatePath("/");
}

export async function updateMember(memberId: string, formData: FormData) {
  const firstName = formData.get("first_name")?.toString().trim();
  const lastName = formData.get("last_name")?.toString().trim();

  if (!memberId) {
    throw new Error("Member ID is missing.");
  }

  if (!firstName || !lastName) {
    throw new Error("Both First Name and Last Name are required.");
  }

  const { error } = await supabaseAdmin
    .from("members")
    .update({
      first_name: firstName,
      last_name: lastName,
    })
    .eq("id", memberId);

  if (error) {
    throw new Error(`Failed to update member: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath(`/members/${memberId}`);
}

export async function deleteMember(id: string) {
  const { error } = await supabaseAdmin.from("members").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
}
