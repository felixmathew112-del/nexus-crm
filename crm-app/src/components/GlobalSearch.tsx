"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, Building2 } from "lucide-react";

type ContactResult = { id: string; name: string; company: string | null; email: string | null };
type DealResult = {
  id: string;
  title: string;
  value: number | null;
  contactName: string | null;
  contactCompany: string | null;
  stageName: string | null;
};
type FlatResult = { kind: "contact"; data: ContactResult } | { kind: "deal"; data: DealResult };

function formatValue(v: number) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  return `₹${v.toLocaleString()}`;
}

export default function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [contactsRes, setContactsRes] = useState<ContactResult[]>([]);
  const [dealsRes, setDealsRes] = useState<DealResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
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

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      const handle = setTimeout(() => {
        setContactsRes([]);
        setDealsRes([]);
        setLoading(false);
      }, 0);
      return () => clearTimeout(handle);
    }
    const handle = setTimeout(() => {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((data: { contacts: ContactResult[]; deals: DealResult[] }) => {
          setContactsRes(data.contacts);
          setDealsRes(data.deals);
          setActiveIndex(0);
          setLoading(false);
        });
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  const flat: FlatResult[] = [
    ...contactsRes.map((c) => ({ kind: "contact" as const, data: c })),
    ...dealsRes.map((d) => ({ kind: "deal" as const, data: d })),
  ];

  function go(item: FlatResult) {
    router.push(item.kind === "contact" ? `/contacts/${item.data.id}` : `/deals/${item.data.id}`);
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || flat.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(flat[activeIndex]);
    }
  }

  const showDropdown = open && query.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative px-3 pt-3">
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search… (⌘K)"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] pl-8 pr-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
        />
      </div>

      {showDropdown && (
        <div className="absolute left-3 right-3 mt-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg max-h-80 overflow-y-auto z-50">
          {loading && <div className="px-3 py-3 text-xs text-[var(--text-muted)]">Searching…</div>}
          {!loading && flat.length === 0 && (
            <div className="px-3 py-3 text-xs text-[var(--text-muted)]">
              No matches for &quot;{query}&quot;
            </div>
          )}
          {!loading && contactsRes.length > 0 && (
            <div>
              <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                Contacts
              </div>
              {contactsRes.map((c) => {
                const idx = flat.findIndex((f) => f.kind === "contact" && f.data.id === c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => go({ kind: "contact", data: c })}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                      idx === activeIndex
                        ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                        : "hover:bg-[var(--surface-raised)]"
                    }`}
                  >
                    <Users size={13} className="shrink-0 text-[var(--text-muted)]" />
                    <span className="truncate">{c.name}</span>
                    {c.company && (
                      <span className="text-xs text-[var(--text-muted)] truncate">
                        — {c.company}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {!loading && dealsRes.length > 0 && (
            <div>
              <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                Deals
              </div>
              {dealsRes.map((d) => {
                const idx = flat.findIndex((f) => f.kind === "deal" && f.data.id === d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => go({ kind: "deal", data: d })}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                      idx === activeIndex
                        ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                        : "hover:bg-[var(--surface-raised)]"
                    }`}
                  >
                    <Building2 size={13} className="shrink-0 text-[var(--text-muted)]" />
                    <span className="truncate">{d.title}</span>
                    <span className="ml-auto text-xs text-[var(--accent)] shrink-0">
                      {formatValue(d.value ?? 0)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
