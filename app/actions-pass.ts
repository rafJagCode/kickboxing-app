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
  revalidatePath("/passes");
}

export async function updatePass(formData: FormData) {
  const passId = formData.get("pass_id") as string;
  const memberId = formData.get("member_id") as string;
  const trainingTypeId = formData.get("training_type_id") as string;
  const startDate = formData.get("start_date") as string;
  const totalEntries = parseInt((formData.get("total_entries") as string) || "4", 10);

  if (!passId || !trainingTypeId || !startDate) {
    throw new Error("Pass ID, training group, and start date are required.");
  }

  if (isNaN(totalEntries) || totalEntries < 0) {
    throw new Error("Total entries must be a non-negative number.");
  }

  const { error } = await supabaseAdmin
    .from("passes")
    .update({
      training_type_id: trainingTypeId,
      start_date: startDate,
      total_entries: totalEntries,
    })
    .eq("id", passId);

  if (error) {
    throw new Error(`Failed to update pass: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/passes");
  revalidatePath(`/members/${memberId}`);
}

export async function deletePass(passId: string, memberId: string) {
  if (!passId) {
    throw new Error("Pass ID is required.");
  }

  const { error } = await supabaseAdmin.from("passes").delete().eq("id", passId);

  if (error) {
    throw new Error(`Failed to delete pass: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/passes");
  revalidatePath(`/members/${memberId}`);
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
  revalidatePath("/passes");
  revalidatePath(`/members/${memberId}`);
}

export async function recordAttendanceForSession(passId: string, memberId: string, sessionDateStr: string) {
  const { data: existingOnDate } = await supabaseAdmin.from("attendances").select("id, date").eq("pass_id", passId);

  const alreadyMarked = existingOnDate?.some((att) => att.date.split("T")[0] === sessionDateStr);

  if (alreadyMarked) {
    throw new Error("Attendance is already recorded for this session date.");
  }

  const timestamp = `${sessionDateStr}T10:00:00.000Z`;

  const { error } = await supabaseAdmin.from("attendances").insert({
    pass_id: passId,
    date: timestamp,
  });

  if (error) {
    throw new Error(`Failed to record session attendance: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/passes");
  revalidatePath(`/members/${memberId}`);
}

export async function undoAttendance(attendanceId: string, memberId: string) {
  const { error } = await supabaseAdmin.from("attendances").delete().eq("id", attendanceId);

  if (error) {
    throw new Error(`Failed to undo attendance: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/passes");
  revalidatePath(`/members/${memberId}`);
}
