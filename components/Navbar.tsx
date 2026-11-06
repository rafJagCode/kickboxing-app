"use client";

import Link from "next/link";
import { Users, CalendarDays, Dumbbell, Settings } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const isActive = (path: string) => (pathname === path ? "text-amber-500 font-semibold" : "text-neutral-500 hover:text-neutral-400");

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-neutral-950/95 backdrop-blur-md border-t border-neutral-800/80 p-2.5 flex justify-around items-center z-40 max-w-md mx-auto">
      <Link href="/" className={`flex flex-col items-center gap-1 py-1 px-3 ${isActive("/")}`}>
        <Users className="w-5 h-5" />
        <span className="text-[10px]">Members</span>
      </Link>

      <Link href="/calendar" className={`flex flex-col items-center gap-1 py-1 px-3 ${isActive("/calendar")}`}>
        <CalendarDays className="w-5 h-5" />
        <span className="text-[10px]">Calendar</span>
      </Link>

      <Link href="/training" className={`flex flex-col items-center gap-1 py-1 px-3 ${isActive("/training")}`}>
        <Dumbbell className="w-5 h-5" />
        <span className="text-[10px]">Groups</span>
      </Link>

      <Link href="/settings" className={`flex flex-col items-center gap-1 py-1 px-3 ${isActive("/settings")}`}>
        <Settings className="w-5 h-5" />
        <span className="text-[10px]">Settings</span>
      </Link>
    </nav>
  );
}
