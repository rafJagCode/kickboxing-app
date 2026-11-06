// Pass issuance and attendance management actions supporting automatic migration of overdraft entries from retired passes and backdating pass start dates.

// Functions:
// - issuePass: Creates a new pass, rolls over overdraft attendances from previous pass, and sets pass start date.
// - recordAttendance: Inserts an attendance timestamp without daily duplicate entries.
// - undoAttendance: Removes an attendance entry by ID.

"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import type { Attendance, Pass } from "@/types/database";

function extractOverdraftAttendances(pass: Pass, attendances: Attendance[]): Attendance[] {
  const sorted = [...attendances].sort((a, b) => a.date.localeCompare(b.date));
  if (pass.total_entries === 0) {
    return sorted;
  }
  return sorted.slice(pass.total_entries);
}

export async function issuePass(formData: FormData) {
  const memberId = formData.get("member_id") as string;
  const trainingTypeId = formData.get("training_type_id") as string;
  let startDate = (formData.get("start_date") as string) || "";
  const totalEntries = parseInt((formData.get("total_entries") as string) || "4", 10);

  if (!memberId || !trainingTypeId) {
    throw new Error("Member ID and Training Group are required.");
  }

  const { data: previousPass } = await supabaseAdmin.from("passes").select("*").eq("member_id", memberId).eq("is_active", true).maybeSingle();

  let overdraftAttendances: Attendance[] = [];

  if (previousPass) {
    const { data: prevAttendances } = await supabaseAdmin.from("attendances").select("*").eq("pass_id", previousPass.id).order("date", { ascending: true });

    if (prevAttendances && prevAttendances.length > 0) {
      overdraftAttendances = extractOverdraftAttendances(previousPass as Pass, prevAttendances as Attendance[]);
    }
  }

  if (overdraftAttendances.length > 0) {
    startDate = overdraftAttendances[0].date.split("T")[0];
  } else if (!startDate) {
    startDate = new Date().toISOString().split("T")[0];
  }

  if (previousPass) {
    await supabaseAdmin.from("passes").update({ is_active: false }).eq("id", previousPass.id);
  }

  const { data: newPass, error: passError } = await supabaseAdmin
    .from("passes")
    .insert({
      member_id: memberId,
      training_type_id: trainingTypeId,
      start_date: startDate,
      total_entries: totalEntries,
      is_active: true,
    })
    .select()
    .single();

  if (passError || !newPass) {
    throw new Error(`Failed to issue pass: ${passError?.message}`);
  }

  if (overdraftAttendances.length > 0) {
    const overdraftIds = overdraftAttendances.map((a) => a.id);
    const { error: transferError } = await supabaseAdmin.from("attendances").update({ pass_id: newPass.id }).in("id", overdraftIds);

    if (transferError) {
      throw new Error(`Failed to rollover overdraft attendances: ${transferError.message}`);
    }
  }

  revalidatePath(`/members/${memberId}`);
  revalidatePath("/");
}

export async function recordAttendance(passId: string, memberId: string) {
  const todayISO = new Date().toISOString().split("T")[0];

  const { data: existingToday } = await supabaseAdmin.from("attendances").select("id, date").eq("pass_id", passId);

  const alreadyMarkedToday = existingToday?.some((att) => att.date.split("T")[0] === todayISO);

  if (alreadyMarkedToday) {
    throw new Error("Attendance has already been recorded for this member today.");
  }

  const { error } = await supabaseAdmin.from("attendances").insert({
    pass_id: passId,
    date: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Failed to record attendance: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath(`/members/${memberId}`);
}

export async function undoAttendance(attendanceId: string, memberId: string) {
  const { error } = await supabaseAdmin.from("attendances").delete().eq("id", attendanceId);

  if (error) {
    throw new Error(`Failed to undo attendance: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath(`/members/${memberId}`);
}
