"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Upload, Search, MessageSquareText } from "lucide-react";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/upload", icon: Upload, label: "Upload" },
  { href: "/search", icon: Search, label: "Search" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 flex flex-col border-r border-white/[0.06] bg-white/[0.02]">
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-white/[0.06]">
        <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center">
          <MessageSquareText size={15} className="text-white" />
        </div>
        <span className="text-sm font-semibold text-white/90 tracking-tight">CommIntel</span>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-indigo-500/15 text-indigo-300"
                  : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/[0.06]">
        <p className="text-[11px] text-white/20 leading-tight">
          Project Communication<br />Intelligence System
        </p>
      </div>
    </aside>
  );
}