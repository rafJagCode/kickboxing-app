"use client";
import Link from "next/link";
import { Users, BookOpen, Settings } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const isActive = (path: string) => (pathname === path ? "text-amber-500" : "text-neutral-500");

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-neutral-950 border-t border-neutral-800 p-3 flex justify-around items-center">
      <Link href="/" className={`flex flex-col items-center gap-1 ${isActive("/")}`}>
        <Users className="w-6 h-6" />
        <span className="text-[10px]">Members</span>
      </Link>
      <Link href="/training" className={`flex flex-col items-center gap-1 ${isActive("/training")}`}>
        <BookOpen className="w-6 h-6" />
        <span className="text-[10px]">Training</span>
      </Link>
      <Link href="/settings" className={`flex flex-col items-center gap-1 ${isActive("/settings")}`}>
        <Settings className="w-6 h-6" />
        <span className="text-[10px]">Settings</span>
      </Link>
    </nav>
  );
}
