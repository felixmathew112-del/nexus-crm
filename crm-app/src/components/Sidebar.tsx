"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Kanban, Users, CheckSquare, BarChart3, ShieldCheck, LogOut } from "lucide-react";
import GlobalSearch from "./GlobalSearch";
import NotificationsBell from "./NotificationsBell";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

type CurrentUser = { id: string; name: string; email: string; role: string | null };

export default function Sidebar({ user }: { user: CurrentUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const isManager = user.role === "manager" || user.role === "admin";
  const visibleNav = isManager
    ? [...nav, { href: "/admin/users", label: "Users", icon: ShieldCheck }]
    : nav;

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-60 shrink-0 border-r border-[var(--border)] bg-[var(--surface)] flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-[var(--border)]">
        <div className="font-display text-lg font-semibold tracking-tight">Nexus CRM</div>
        <div className="text-xs text-[var(--text-muted)] mt-0.5">Phase 1 — Core Engine</div>
      </div>
      <GlobalSearch />
      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleNav.map((item) => {
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
      <div className="px-5 py-4 border-t border-[var(--border)]">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{user.name}</div>
            <div className="text-xs text-[var(--text-muted)] truncate">{user.email}</div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <NotificationsBell />
            <button
              type="button"
              title="Log out"
              onClick={handleLogout}
              className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
