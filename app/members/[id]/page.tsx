import { supabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Calendar, CreditCard, ShieldAlert } from "lucide-react";
import Navbar from "@/components/Navbar";
import type { Member } from "@/types/database";

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: member, error } = await supabaseAdmin.from("members").select("*").eq("id", id).single();

  if (error || !member) {
    notFound();
  }

  const typedMember = member as Member;

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 pb-24 p-4 max-w-md mx-auto">
      {/* Back button */}
      <div className="mb-4">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Members
        </Link>
      </div>

      {/* Member Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center gap-3.5 mb-6">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-base shrink-0">
          {typedMember.first_name[0]}
          {typedMember.last_name[0]}
        </div>
        <div>
          <h1 className="text-lg font-bold text-neutral-100">
            {typedMember.first_name} {typedMember.last_name}
          </h1>
          <p className="text-xs text-neutral-500">Member since {new Date(typedMember.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Placeholders for Phase 4 & Phase 6 modules */}
      <div className="space-y-4">
        {/* Active Pass Section (Phase 6) */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-amber-500" />
            <span>Active Pass & Attendance</span>
          </div>
          <p className="text-xs text-neutral-500">Pass issuance and attendance check-in circles will be wired in Phase 6.</p>
        </div>

        {/* Payment Proofs Section (Phase 4) */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            <CreditCard className="w-4 h-4 text-emerald-500" />
            <span>Payment Receipts</span>
          </div>
          <p className="text-xs text-neutral-500">Receipt uploads and PDF/image lightbox previews will be wired in Phase 4.</p>
        </div>
      </div>

      <Navbar />
    </main>
  );
}
