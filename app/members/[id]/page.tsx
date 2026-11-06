/*
 * Description: Profile page supplying available training groups and active membership pass group to MemberHeader.
 * Config: Resolves active pass training group id from passes table.
 */
import { supabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import MemberHeader from "@/components/MemberHeader";
import PassManager from "@/components/PassManager";
import ReceiptManager from "@/components/ReceiptManager";
import type { Member, Pass, Attendance, CalendarSession, TrainingType, PaymentProof } from "@/types/database";

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [{ data: member, error: memberError }, { data: proofs }, { data: passes }, { data: attendances }, { data: sessions }, { data: trainingTypes }] = await Promise.all([
    supabaseAdmin.from("members").select("*").eq("id", id).single(),
    supabaseAdmin.from("payment_proofs").select("*").eq("member_id", id).order("booking_date", { ascending: false }),
    supabaseAdmin.from("passes").select("*").eq("member_id", id).order("created_at", { ascending: false }),
    supabaseAdmin.from("attendances").select("*").order("date", { ascending: true }),
    supabaseAdmin.from("calendar_sessions").select("*"),
    supabaseAdmin.from("training_types").select("*").order("name"),
  ]);

  if (memberError || !member) {
    notFound();
  }

  const typedMember = member as Member;
  const typedPasses = (passes as Pass[]) || [];
  const activePass = typedPasses.find((p) => p.is_active) || null;
  const pastPasses = typedPasses.filter((p) => !p.is_active);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 pb-24 p-4 max-w-md mx-auto">
      <div className="mb-4">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Directory
        </Link>
      </div>

      <MemberHeader member={typedMember} trainingTypes={(trainingTypes as TrainingType[]) || []} currentTrainingTypeId={activePass?.training_type_id} />

      <div className="space-y-6">
        <PassManager
          memberId={typedMember.id}
          activePass={activePass}
          pastPasses={pastPasses}
          attendances={(attendances as Attendance[]) || []}
          trainingTypes={(trainingTypes as TrainingType[]) || []}
          sessions={(sessions as CalendarSession[]) || []}
        />

        <ReceiptManager memberId={typedMember.id} initialReceipts={(proofs as PaymentProof[]) || []} />
      </div>

      <Navbar />
    </main>
  );
}
