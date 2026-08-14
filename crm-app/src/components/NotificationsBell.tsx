"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, AlertTriangle, Clock } from "lucide-react";
import { getDueStatus } from "@/lib/dueStatus";

type Notification = {
  id: string;
  type: string;
  dealId: string | null;
  contactId: string | null;
  message: string;
  read: boolean | null;
  createdAt: string | null;
};

type Task = {
  id: string;
  title: string;
  dueDate: string | null;
  done: boolean | null;
  ownerId: string | null;
};

const POLL_INTERVAL_MS = 30000;

export default function NotificationsBell({ userId }: { userId: string }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function refresh() {
      fetch("/api/notifications")
        .then((r) => r.json())
        .then(setNotifications);
      fetch("/api/tasks")
        .then((r) => r.json())
        .then(setTasks);
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

  const dueTasks = useMemo(() => {
    return tasks
      .filter((t) => t.ownerId === userId)
      .map((t) => ({ task: t, status: getDueStatus(t.dueDate, t.done) }))
      .filter((t): t is { task: Task; status: "overdue" | "today" } =>
        t.status === "overdue" || t.status === "today"
      )
      .sort((a, b) => (a.task.dueDate ?? "").localeCompare(b.task.dueDate ?? ""));
  }, [tasks, userId]);

  const unreadNotifications = notifications.filter((n) => !n.read).length;
  const unreadCount = unreadNotifications + dueTasks.length;

  function handleItemClick(n: Notification) {
    setOpen(false);
    if (!n.read) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      fetch(`/api/notifications/${n.id}`, { method: "PATCH" });
    }
    if (n.dealId) router.push(`/deals/${n.dealId}`);
    else if (n.contactId) router.push(`/contacts/${n.contactId}`);
    else if (n.type === "task_assigned") router.push("/tasks");
    else if (n.type === "bulk_reassignment") router.push("/contacts");
  }

  function handleTaskClick() {
    setOpen(false);
    router.push("/tasks");
  }

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    fetch("/api/notifications/read-all", { method: "POST" });
  }

  const isEmpty = notifications.length === 0 && dueTasks.length === 0;

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
        <div className="absolute right-0 bottom-full mb-2 w-72 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg max-h-96 overflow-y-auto z-50">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]">
            <span className="text-xs font-semibold">Notifications</span>
            {unreadNotifications > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-[var(--accent)] hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>
          {isEmpty && (
            <div className="px-3 py-4 text-xs text-[var(--text-muted)] text-center">
              Nothing yet.
            </div>
          )}

          {dueTasks.length > 0 && (
            <div>
              <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                Tasks due
              </div>
              {dueTasks.map(({ task, status }) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={handleTaskClick}
                  className="w-full flex items-start gap-2 px-3 py-2.5 text-left text-xs border-b border-[var(--border)] last:border-b-0 transition-colors hover:bg-[var(--surface-raised)]"
                >
                  {status === "overdue" ? (
                    <AlertTriangle size={13} className="mt-0.5 shrink-0 text-risk" />
                  ) : (
                    <Clock size={13} className="mt-0.5 shrink-0 text-[var(--accent)]" />
                  )}
                  <span>
                    {task.title}
                    <span className={status === "overdue" ? "text-risk" : "text-[var(--accent)]"}>
                      {" "}
                      — {status === "overdue" ? "overdue" : "due today"}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {notifications.length > 0 && (
            <div>
              {dueTasks.length > 0 && (
                <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                  Assignments
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
      )}
    </div>
  );
}
