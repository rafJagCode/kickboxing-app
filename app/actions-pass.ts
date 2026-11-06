// Server actions handling pass creation, attendance check-in, and check-in revocation. Enforces that only one active pass exists per member and prevents duplicate attendance entries on the same calendar day.

// Actions:
// - issuePass: Deactivates any existing active pass for the member and writes a new active pass.
// - recordAttendance: Inserts an attendance entry with the current timestamp.
// - undoAttendance: Deletes an attendance record by ID.

"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function issuePass(formData: FormData) {
  const memberId = formData.get("member_id") as string;
  const trainingTypeId = formData.get("training_type_id") as string;
  const startDate = formData.get("start_date") as string;
  const totalEntries = parseInt((formData.get("total_entries") as string) || "4", 10);

  if (!memberId || !trainingTypeId || !startDate) {
    throw new Error("All pass fields are required.");
  }

  await supabaseAdmin.from("passes").update({ is_active: false }).eq("member_id", memberId).eq("is_active", true);

  const { error } = await supabaseAdmin.from("passes").insert({
    member_id: memberId,
    training_type_id: trainingTypeId,
    start_date: startDate,
    total_entries: totalEntries,
    is_active: true,
  });

  if (error) {
    throw new Error(`Failed to issue pass: ${error.message}`);
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
