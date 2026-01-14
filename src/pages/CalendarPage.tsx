import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addMonths, endOfMonth, startOfMonth, toDateKey } from "../lib/date";
import { loadAll, DayLog } from "../lib/storage";

function range(n: number) {
  return Array.from({ length: n }, (_, i) => i);
}

export default function CalendarPage() {
  const nav = useNavigate();
  const [cursor, setCursor] = useState(() => new Date());
  const [all, setAll] = useState<Record<string, DayLog>>({});

  useEffect(() => {
    setAll(loadAll());
  }, []);

  const monthStart = useMemo(() => startOfMonth(cursor), [cursor]);
  const monthEnd = useMemo(() => endOfMonth(cursor), [cursor]);

  const firstDow = monthStart.getDay(); // 0..6
  const daysInMonth = monthEnd.getDate();

  const cells = useMemo(() => {
    const list: Array<{ date: Date | null; key?: string }> = [];
    // leading blanks
    range(firstDow).forEach(() => list.push({ date: null }));
    // days
    range(daysInMonth).forEach((i) => {
      const d = new Date(cursor.getFullYear(), cursor.getMonth(), i + 1);
      list.push({ date: d, key: toDateKey(d) });
    });
    // trailing blanks to fill 6 rows (optional)
    while (list.length % 7 !== 0) list.push({ date: null });
    return list;
  }, [cursor, firstDow, daysInMonth]);

  return (
    <div className="min-h-screen p-5 md:p-8" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-3xl mx-auto space-y-4">
        <header className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: "var(--primary)" }}>
              My Life Log
            </h1>
            <p className="text-sm opacity-70">日付を選んで記録へ</p>
          </div>

          <div className="flex gap-2">
            <button
              className="px-3 py-2 rounded border"
              style={{ borderColor: "var(--border)" }}
              onClick={() => setCursor(addMonths(cursor, -1))}
            >
              ←
            </button>
            <button
              className="px-3 py-2 rounded border"
              style={{ borderColor: "var(--border)" }}
              onClick={() => setCursor(addMonths(cursor, 1))}
            >
              →
            </button>
          </div>
        </header>

        <div className="rounded-lg border p-3 md:p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-lg font-medium">
              {cursor.getFullYear()}年 {cursor.getMonth() + 1}月
            </div>
          </div>

          <div className="grid grid-cols-7 text-xs opacity-70 mb-2">
            {["日", "月", "火", "水", "木", "金", "土"].map((w) => (
              <div key={w} className="text-center py-1">
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {cells.map((c, idx) => {
              if (!c.date || !c.key) {
                return <div key={idx} className="h-16 md:h-20 rounded" />;
              }

              const log = all[c.key] || {};
              const wake = log.wakeTime ? String(log.wakeTime).slice(0, 5) : "";
              const todos = Array.isArray(log.todos) ? log.todos : [];
              const allDone = todos.length > 0 && todos.every((t) => t.done);

              return (
                <button
                  key={c.key}
                  onClick={() => nav(`/day/${c.key}`)}
                  className="h-16 md:h-20 rounded border text-left p-2 hover:opacity-90"
                  style={{ borderColor: "var(--border)", background: "#fff" }}
                >
                  <div className="text-sm font-medium">{c.date.getDate()}</div>
                  {wake && <div className="text-[11px] mt-0.5" style={{ color: "var(--primary)" }}>{wake}</div>}
                  {allDone && <div className="text-[12px] mt-0.5">🌟</div>}
                </button>
              );
            })}
          </div>
        </div>

        <footer className="text-xs opacity-60">
          ※ 記録はこの端末のブラウザに保存されます（localStorage / 写真はIndexedDB）。
        </footer>
      </div>
    </div>
  );
}
