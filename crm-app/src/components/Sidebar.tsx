"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Kanban, Users, CheckSquare } from "lucide-react";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-60 shrink-0 border-r border-[var(--border)] bg-[var(--surface)] flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-[var(--border)]">
        <div className="font-display text-lg font-semibold tracking-tight">Nexus CRM</div>
        <div className="text-xs text-[var(--text-muted)] mt-0.5">Phase 1 — Core Engine</div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--text)]"
              }`}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
        Built for HSJB client rollouts
      </div>
    </aside>
  );
}
