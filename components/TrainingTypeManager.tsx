"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Dumbbell } from "lucide-react";
import { addTrainingType, deleteTrainingType } from "./actions";
import type { TrainingType } from "@/types/database";

export default function TrainingTypeManager({ initialGroups }: { initialGroups: TrainingType[] }) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);

    const formData = new FormData();
    formData.append("name", name);

    startTransition(async () => {
      try {
        await addTrainingType(formData);
        setName("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error adding group");
      }
    });
  };

  const handleDelete = (id: string, groupName: string) => {
    if (confirm(`Delete group "${groupName}"?`)) {
      setError(null);
      startTransition(async () => {
        try {
          await deleteTrainingType(id);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Error deleting group");
        }
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Add New Group Form */}
      <form onSubmit={handleAdd} className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New group name (e.g. Sparring)"
            className="flex-1 px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
          <button
            type="submit"
            disabled={isPending || !name.trim()}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-semibold rounded-xl text-sm transition-colors cursor-pointer flex items-center gap-1 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
        {error && <p className="text-xs text-red-400 px-1">{error}</p>}
      </form>

      {/* List */}
      <div className="space-y-2 pt-2">
        {initialGroups.map((group) => (
          <div key={group.id} className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Dumbbell className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-neutral-200">{group.name}</span>
            </div>
            <button onClick={() => handleDelete(group.id, group.name)} className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition-colors" title="Delete group">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
