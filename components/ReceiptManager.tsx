"use client";

import { useState, useTransition } from "react";
import { FileText, Image as ImageIcon, Upload, Calendar, Trash2, ExternalLink, Eye, X, AlertCircle, CheckCircle } from "lucide-react";
import { uploadPaymentProof, deletePaymentProof } from "@/app/members/[id]/receipt-actions";
import type { PaymentProof } from "@/types/database";

interface ReceiptManagerProps {
  memberId: string;
  initialReceipts: PaymentProof[];
}

export default function ReceiptManager({ memberId, initialReceipts }: ReceiptManagerProps) {
  const [isUploading, startUploadTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [bookingDate, setBookingDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [activePreview, setActivePreview] = useState<PaymentProof | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select a file first.");
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.append("member_id", memberId);
    formData.append("booking_date", bookingDate);
    formData.append("file", selectedFile);

    startUploadTransition(async () => {
      try {
        await uploadPaymentProof(formData);
        setSelectedFile(null);
        // Reset file input element
        const inputElem = document.getElementById("receipt-file-input") as HTMLInputElement;
        if (inputElem) inputElem.value = "";
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    });
  };

  const handleDelete = (proof: PaymentProof) => {
    if (confirm(`Delete receipt dated ${new Date(proof.booking_date).toLocaleDateString()}?`)) {
      startDeleteTransition(async () => {
        try {
          await deletePaymentProof(proof.id, memberId, proof.file_url);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Delete failed");
        }
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Box */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Upload className="w-4 h-4 text-emerald-500" />
          <h2 className="text-sm font-bold text-neutral-100">Attach Payment Proof</h2>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleUploadSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Booking Date Picker */}
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">Booking Date (From Bank Slip)</label>
              <div className="relative">
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>

            {/* File Selector */}
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">Receipt File (PDF or Image)</label>
              <input
                id="receipt-file-input"
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                required
                className="w-full text-xs text-neutral-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-neutral-800 file:text-neutral-200 hover:file:bg-neutral-700 cursor-pointer bg-neutral-950 border border-neutral-800 rounded-xl py-1 px-2"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isUploading || !selectedFile}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-neutral-950 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
          >
            {isUploading ? "Uploading & Verifying..." : "Upload & Save Receipt"}
          </button>
        </form>
      </div>

      {/* Receipts History List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-neutral-400 px-1 font-semibold uppercase tracking-wider">
          <span>Verified Receipts ({initialReceipts.length})</span>
          <span className="text-[10px] text-neutral-500">Ordered by booking date</span>
        </div>

        {initialReceipts.length === 0 ? (
          <div className="p-6 text-center bg-neutral-900/40 border border-neutral-900 rounded-2xl">
            <FileText className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
            <p className="text-xs text-neutral-400">No payment proofs uploaded yet</p>
          </div>
        ) : (
          initialReceipts.map((proof) => (
            <div key={proof.id} className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-neutral-800 border border-neutral-700/80 flex items-center justify-center shrink-0">
                  {proof.file_type === "pdf" ? <FileText className="w-4 h-4 text-red-400" /> : <ImageIcon className="w-4 h-4 text-emerald-400" />}
                </div>

                <div className="truncate">
                  <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                    <span>{new Date(proof.booking_date).toLocaleDateString()}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-neutral-800 text-neutral-400 rounded">{proof.file_type}</span>
                  </div>
                  <div className="text-[10px] text-neutral-500">Uploaded {new Date(proof.created_at).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setActivePreview(proof)}
                  className="p-2 text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                  title="Preview Receipt"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">View</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(proof)}
                  disabled={isDeleting}
                  className="p-2 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                  title="Delete Receipt"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Lightbox / Preview Modal */}
      {activePreview && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col justify-between p-3 sm:p-6 animate-in fade-in duration-150">
          {/* Header */}
          <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 max-w-2xl w-full mx-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-neutral-200">Receipt dated: {new Date(activePreview.booking_date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={activePreview.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white bg-neutral-800 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Tab</span>
              </a>
              <button type="button" onClick={() => setActivePreview(null)} className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Viewer Container */}
          <div className="flex-1 max-w-2xl w-full mx-auto my-3 flex items-center justify-center overflow-hidden bg-neutral-950 rounded-2xl border border-neutral-900">
            {activePreview.file_type === "pdf" ? (
              <iframe src={`${activePreview.file_url}#toolbar=0`} className="w-full h-full rounded-2xl border-0" title="PDF Receipt Preview" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={activePreview.file_url} alt="Payment proof screenshot" className="max-h-full max-w-full object-contain rounded-xl select-none" />
            )}
          </div>

          {/* Footer Dismiss Button */}
          <div className="max-w-2xl w-full mx-auto">
            <button type="button" onClick={() => setActivePreview(null)} className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-medium rounded-xl text-xs transition-colors">
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
