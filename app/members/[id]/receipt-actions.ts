"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import type { FileType } from "@/types/database";

export async function uploadPaymentProof(formData: FormData) {
  const memberId = formData.get("member_id") as string;
  const bookingDate = formData.get("booking_date") as string;
  const file = formData.get("file") as File | null;

  if (!memberId) {
    throw new Error("Member ID is missing.");
  }

  if (!bookingDate) {
    throw new Error("Booking date is required.");
  }

  if (!file || file.size === 0) {
    throw new Error("Please select a receipt file (PDF or Image).");
  }

  // Determine file type
  const mimeType = file.type.toLowerCase();
  let fileType: FileType = "img";

  if (mimeType.includes("pdf")) {
    fileType = "pdf";
  } else if (mimeType.includes("image") || mimeType.includes("jpeg") || mimeType.includes("jpg") || mimeType.includes("png") || mimeType.includes("webp")) {
    fileType = "img";
  } else {
    throw new Error("Unsupported format. Only PDF, JPG, PNG, and WEBP files are accepted.");
  }

  // Sanitize file extension and build storage path
  const originalExt = file.name.split(".").pop()?.toLowerCase() || (fileType === "pdf" ? "pdf" : "jpg");
  const safeExt = originalExt.replace(/[^a-z0-9]/g, "");
  const fileName = `${memberId}/${Date.now()}-${crypto.randomUUID()}.${safeExt}`;

  // Read file as ArrayBuffer and upload to Supabase Storage
  const arrayBuffer = await file.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);

  const { error: storageError } = await supabaseAdmin.storage.from("receipts").upload(fileName, fileBuffer, {
    contentType: file.type || (fileType === "pdf" ? "application/pdf" : "image/jpeg"),
    upsert: false,
  });

  if (storageError) {
    throw new Error(`Storage upload failed: ${storageError.message}`);
  }

  // Retrieve public URL
  const { data: publicUrlData } = supabaseAdmin.storage.from("receipts").getPublicUrl(fileName);

  const fileUrl = publicUrlData.publicUrl;

  // Insert payment proof record into database
  const { error: dbError } = await supabaseAdmin.from("payment_proofs").insert({
    member_id: memberId,
    file_url: fileUrl,
    file_type: fileType,
    booking_date: bookingDate,
  });

  if (dbError) {
    // Rollback uploaded file if DB insertion fails
    await supabaseAdmin.storage.from("receipts").remove([fileName]);
    throw new Error(`Database record creation failed: ${dbError.message}`);
  }

  revalidatePath(`/members/${memberId}`);
}

export async function deletePaymentProof(proofId: string, memberId: string, fileUrl: string) {
  // Extract relative storage path from fileUrl
  try {
    const urlParts = fileUrl.split("/receipts/");
    if (urlParts.length > 1) {
      const storagePath = decodeURIComponent(urlParts[1]);
      await supabaseAdmin.storage.from("receipts").remove([storagePath]);
    }
  } catch (err) {
    console.warn("Could not remove file from storage, continuing DB deletion:", err);
  }

  // Delete DB record
  const { error } = await supabaseAdmin.from("payment_proofs").delete().eq("id", proofId);

  if (error) {
    throw new Error(`Failed to delete payment proof: ${error.message}`);
  }

  revalidatePath(`/members/${memberId}`);
}
