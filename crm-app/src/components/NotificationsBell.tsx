"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";

type Notification = {
  id: string;
  type: string;
  dealId: string | null;
  contactId: string | null;
  message: string;
  read: boolean | null;
  createdAt: string | null;
};

const POLL_INTERVAL_MS = 30000;

export default function NotificationsBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function refresh() {
      fetch("/api/notifications")
        .then((r) => r.json())
        .then(setNotifications);
    }
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function handleItemClick(n: Notification) {
    setOpen(false);
    if (!n.read) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      fetch(`/api/notifications/${n.id}`, { method: "PATCH" });
    }
    if (n.dealId) router.push(`/deals/${n.dealId}`);
    else if (n.contactId) router.push(`/contacts/${n.contactId}`);
  }

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    fetch("/api/notifications/read-all", { method: "POST" });
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        title="Notifications"
        onClick={() => setOpen((v) => !v)}
        className="relative text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-risk text-white text-[10px] font-medium leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 bottom-full mb-2 w-72 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg max-h-80 overflow-y-auto z-50">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]">
            <span className="text-xs font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-[var(--accent)] hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>
          {notifications.length === 0 && (
            <div className="px-3 py-4 text-xs text-[var(--text-muted)] text-center">
              Nothing yet.
            </div>
          )}
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => handleItemClick(n)}
              className={`w-full flex items-start gap-2 px-3 py-2.5 text-left text-xs border-b border-[var(--border)] last:border-b-0 transition-colors hover:bg-[var(--surface-raised)] ${
                n.read ? "text-[var(--text-muted)]" : "text-[var(--text)]"
              }`}
            >
              <span
                className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${
                  n.read ? "bg-transparent" : "bg-[var(--accent)]"
                }`}
              />
              {n.message}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
