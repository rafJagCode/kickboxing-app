"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { getSaturdaysInMonth } from "@/lib/date-utils";
import type { CalendarSessionStatus } from "@/types/database";

export async function upsertSessionStatus(trainingTypeId: string, date: string, status: CalendarSessionStatus) {
  if (!trainingTypeId || !date || !status) {
    throw new Error("Missing required calendar parameters.");
  }

  const { error } = await supabaseAdmin.from("calendar_sessions").upsert(
    {
      training_type_id: trainingTypeId,
      date,
      status,
    },
    {
      onConflict: "training_type_id,date",
    },
  );

  if (error) {
    throw new Error(`Failed to update session: ${error.message}`);
  }

  revalidatePath("/calendar");
  revalidatePath("/");
}

export async function addSessionDate(trainingTypeId: string, date: string) {
  if (!trainingTypeId || !date) {
    throw new Error("Training group and date are required.");
  }

  const { error } = await supabaseAdmin.from("calendar_sessions").upsert(
    {
      training_type_id: trainingTypeId,
      date,
      status: "PLANNED",
    },
    {
      onConflict: "training_type_id,date",
    },
  );

  if (error) {
    throw new Error(`Failed to add session: ${error.message}`);
  }

  revalidatePath("/calendar");
  revalidatePath("/");
}

export async function populateSaturdaysForMonth(trainingTypeId: string, year: number, month: number) {
  const saturdays = getSaturdaysInMonth(year, month);
  if (saturdays.length === 0) return;

  const rows = saturdays.map((date) => ({
    training_type_id: trainingTypeId,
    date,
    status: "PLANNED",
  }));

  const { error } = await supabaseAdmin.from("calendar_sessions").upsert(rows, { onConflict: "training_type_id,date" });

  if (error) {
    throw new Error(`Failed to auto-populate Saturdays: ${error.message}`);
  }

  revalidatePath("/calendar");
  revalidatePath("/");
}

export async function deleteSessionDate(sessionId: string) {
  const { error } = await supabaseAdmin.from("calendar_sessions").delete().eq("id", sessionId);

  if (error) {
    throw new Error(`Failed to delete session: ${error.message}`);
  }

  revalidatePath("/calendar");
  revalidatePath("/");
}
