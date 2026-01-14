import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fromDateKey } from "../lib/date";
import { loadAll, getDay } from "../lib/storage";

const tiles: Array<{ key: string; title: string; icon: string; desc: string }> = [
  { key: "time", title: "時間", icon: "🕓", desc: "起床・就寝" },
  { key: "steps", title: "歩数", icon: "🚶", desc: "今日の歩数" },
  { key: "study", title: "勉強", icon: "📚", desc: "学習時間" },
  { key: "weight", title: "体重", icon: "⚖️", desc: "体重" },
  { key: "todo", title: "ToDo", icon: "✅", desc: "タスク" },
  { key: "cleaning", title: "掃除", icon: "🧹", desc: "部屋マップ" },
  { key: "money", title: "家計簿", icon: "💰", desc: "支出の明細" },
  { key: "photo", title: "写真・メモ", icon: "🖼️", desc: "写真とコメント" },
];

export default function DayMenuPage() {
  const nav = useNavigate();
  const { dateKey } = useParams();
  if (!dateKey) return null;

  const d = fromDateKey(dateKey);
  const all = useMemo(() => loadAll(), []);
  const log = getDay(all, dateKey);

  const summary = useMemo(() => {
    const wake = log.wakeTime ? String(log.wakeTime).slice(0, 5) : "—";
    const steps = log.steps || "—";
    const study = log.studyMinutes || "—";
    const weight = log.weight || "—";
    return { wake, steps, study, weight };
  }, [log]);

  return (
    <div className="min-h-screen p-5 md:p-8" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-3xl mx-auto space-y-4">
        <header className="flex items-start justify-between gap-3">
          <div>
            <button
              onClick={() => nav("/")}
              className="text-sm underline underline-offset-4 opacity-80"
              style={{ color: "var(--primary)" }}
            >
              ← カレンダーへ戻る
            </button>
            <h2 className="text-xl font-semibold mt-2" style={{ color: "var(--primary)" }}>
              {d.getMonth() + 1}/{d.getDate()} の記録
            </h2>
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            ["起床", summary.wake],
            ["歩数", summary.steps],
            ["勉強(分)", summary.study],
            ["体重", summary.weight],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg border p-3" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
              <div className="text-xs opacity-70">{k}</div>
              <div className="text-lg font-medium">{v}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {tiles.map((t) => (
            <button
              key={t.key}
              onClick={() => nav(`/day/${dateKey}/${t.key}`)}
              className="rounded-xl border p-4 text-left hover:opacity-90"
              style={{ borderColor: "var(--border)", background: "#fff" }}
            >
              <div className="text-2xl">{t.icon}</div>
              <div className="mt-2 font-semibold">{t.title}</div>
              <div className="text-xs opacity-70 mt-1">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
