import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fromDateKey } from "../lib/date";
import { CleaningState, DayLog, ExpenseItem, Todo, loadAll, saveAll, updateDay } from "../lib/storage";
import { deletePhoto, getPhoto, savePhoto } from "../lib/photoDb";

const AREAS: Record<string, { x: number; y: number; w: number; h: number; label: string }> = {
  veranda: { x: 20, y: 10, w: 260, h: 40, label: "ベランダ" },
  room: { x: 20, y: 60, w: 260, h: 130, label: "洋室" },
  closet: { x: 210, y: 150, w: 60, h: 40, label: "クローゼット" },
  kitchen: { x: 20, y: 200, w: 150, h: 75, label: "キッチン" },
  toilet: { x: 190, y: 200, w: 90, h: 25, label: "トイレ" },
  bath: { x: 190, y: 225, w: 90, h: 25, label: "浴室" },
  washbasin: { x: 190, y: 250, w: 90, h: 25, label: "洗面" },
  entrance: { x: 80, y: 280, w: 140, h: 40, label: "玄関" },
};

function Title({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-semibold" style={{ color: "var(--primary)" }}>{children}</h2>;
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      {children}
    </div>
  );
}

export default function SectionPage() {
  const nav = useNavigate();
  const { dateKey, section } = useParams();
  if (!dateKey || !section) return null;

  const d = fromDateKey(dateKey);

  const [all, setAll] = useState<Record<string, DayLog>>({});
  const day = useMemo(() => all[dateKey] || {}, [all, dateKey]);

  // 共通：保存
  const commit = (partial: Partial<DayLog>) => {
    const nextAll = updateDay(all, dateKey, partial);
    setAll(nextAll);
    saveAll(nextAll);
  };

  // 初期ロード
  useEffect(() => {
    setAll(loadAll());
  }, []);

  // ---- TIME
  const [wakeTime, setWakeTime] = useState("");
  const [sleepTime, setSleepTime] = useState("");

  // ---- STEPS
  const [steps, setSteps] = useState("");

  // ---- STUDY
  const [studyMinutes, setStudyMinutes] = useState("");

  // ---- WEIGHT
  const [weight, setWeight] = useState("");

  // ---- TODO
  const [todoText, setTodoText] = useState("");
  const [todos, setTodos] = useState<Todo[]>([]);

  // ---- CLEANING
  const [cleaning, setCleaning] = useState<CleaningState>({});

  // ---- MONEY
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);

  // ---- PHOTO/MEMO
  const [photo, setPhotoState] = useState("");
  const [memo, setMemo] = useState("");
  const [editingMemo, setEditingMemo] = useState(true);

  // 日付のデータをフォームへ反映
  useEffect(() => {
    setWakeTime(day.wakeTime || "");
    setSleepTime(day.sleepTime || "");
    setSteps(day.steps || "");
    setStudyMinutes(day.studyMinutes || "");
    setWeight(day.weight || "");
    setTodos(Array.isArray(day.todos) ? day.todos : []);
    setCleaning(day.cleaning || {});
    setExpenses(Array.isArray(day.expenses) ? day.expenses : []);
    setMemo(day.memo || "");
    setEditingMemo(!(day.memo && day.memo.trim().length > 0));

    if (section === "photo") {
      (async () => {
        const p = await getPhoto(dateKey);
        setPhotoState(p || "");
      })();
    }
  }, [day, dateKey, section]);

  // ToDo 完了→🌟表示（カレンダー側が参照）
  const allDone = todos.length > 0 && todos.every((t) => t.done);

  // ToDo 持ち越し：未完了を翌日にコピー（翌日のtodosに追加）
  const carryOver = () => {
    const remain = todos.filter((t) => !t.done);
    if (remain.length === 0) return;

    const nextDay = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    const nextKey = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, "0")}-${String(nextDay.getDate()).padStart(2, "0")}`;

    const nextAll = { ...all };
    const nextLog = nextAll[nextKey] || {};
    const nextTodos = Array.isArray(nextLog.todos) ? nextLog.todos : [];
    nextAll[nextKey] = {
      ...nextLog,
      todos: [
        ...nextTodos,
        ...remain.map((t) => ({ ...t, id: Date.now() + Math.floor(Math.random() * 100000) })),
      ],
    };

    setAll(nextAll);
    saveAll(nextAll);
    alert("未完了ToDoを翌日に持ち越しました。");
  };

  // 月合計（家計簿）
  const monthlyTotal = useMemo(() => {
    const y = d.getFullYear();
    const m = d.getMonth();
    let sum = 0;
    for (const [k, v] of Object.entries(all)) {
      const kd = fromDateKey(k);
      if (kd.getFullYear() !== y || kd.getMonth() !== m) continue;
      const items = Array.isArray(v.expenses) ? v.expenses : [];
      sum += items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
    }
    return sum;
  }, [all, d]);

  const dayTotal = useMemo(() => expenses.reduce((s, it) => s + (Number(it.amount) || 0), 0), [expenses]);

  // 掃除トグル
  const toggleArea = (key: string) => {
    const next = { ...cleaning, [key]: !cleaning[key] };
    setCleaning(next);
    commit({ cleaning: next });
  };

  // 写真
  const uploadPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = String(ev.target?.result || "");
      setPhotoState(dataUrl);
      await savePhoto(dateKey, dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = async () => {
    await deletePhoto(dateKey);
    setPhotoState("");
  };

  // メモ保存（写真の下）
  const saveMemoOnly = () => {
    commit({ memo });
    setEditingMemo(false);
  };

  // ========== UI ==========
  return (
    <div className="min-h-screen p-5 md:p-8" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-3xl mx-auto space-y-4">
        <header className="flex items-start justify-between gap-3">
          <div>
            <button
              onClick={() => nav(`/day/${dateKey}`)}
              className="text-sm underline underline-offset-4 opacity-80"
              style={{ color: "var(--primary)" }}
            >
              ← メニューへ戻る
            </button>
            <div className="text-sm opacity-70 mt-1">
              {d.getFullYear()}年{d.getMonth() + 1}月{d.getDate()}日
            </div>
          </div>

          <div className="text-sm opacity-70">
            {allDone && section !== "todo" ? "🌟 ToDo完了" : ""}
          </div>
        </header>

        {/* TIME */}
        {section === "time" && (
          <Card>
            <Title>時間（起床・就寝）</Title>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-sm opacity-70">起床</label>
                <input
                  className="mt-1 w-full rounded border px-3 py-2"
                  style={{ borderColor: "var(--border)" }}
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm opacity-70">就寝</label>
                <input
                  className="mt-1 w-full rounded border px-3 py-2"
                  style={{ borderColor: "var(--border)" }}
                  type="time"
                  value={sleepTime}
                  onChange={(e) => setSleepTime(e.target.value)}
                />
              </div>
            </div>

            <button
              className="mt-4 w-full rounded px-3 py-2 text-white"
              style={{ background: "var(--primary)" }}
              onClick={() => commit({ wakeTime, sleepTime })}
            >
              保存
            </button>
          </Card>
        )}

        {/* STEPS */}
        {section === "steps" && (
          <Card>
            <Title>歩数</Title>
            <div className="mt-3">
              <label className="text-sm opacity-70">今日の歩数</label>
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                style={{ borderColor: "var(--border)" }}
                type="number"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                placeholder="例：8421"
              />
              <button
                className="mt-4 w-full rounded px-3 py-2 text-white"
                style={{ background: "var(--primary)" }}
                onClick={() => commit({ steps })}
              >
                保存
              </button>
            </div>
          </Card>
        )}

        {/* STUDY */}
        {section === "study" && (
          <Card>
            <Title>勉強</Title>
            <div className="mt-3">
              <label className="text-sm opacity-70">勉強時間（分）</label>
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                style={{ borderColor: "var(--border)" }}
                type="number"
                value={studyMinutes}
                onChange={(e) => setStudyMinutes(e.target.value)}
                placeholder="例：90"
              />
              <button
                className="mt-4 w-full rounded px-3 py-2 text-white"
                style={{ background: "var(--primary)" }}
                onClick={() => commit({ studyMinutes })}
              >
                保存
              </button>
            </div>
          </Card>
        )}

        {/* WEIGHT */}
        {section === "weight" && (
          <Card>
            <Title>体重</Title>
            <div className="mt-3">
              <label className="text-sm opacity-70">体重（kg）</label>
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                style={{ borderColor: "var(--border)" }}
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="例：52.3"
              />
              <button
                className="mt-4 w-full rounded px-3 py-2 text-white"
                style={{ background: "var(--primary)" }}
                onClick={() => commit({ weight })}
              >
                保存
              </button>
            </div>
          </Card>
        )}

        {/* TODO */}
        {section === "todo" && (
          <Card>
            <Title>ToDo</Title>
            <div className="mt-2 text-sm opacity-70">
              全部完了でカレンダーに「🌟」が出ます
            </div>

            <div className="mt-3 flex gap-2">
              <input
                className="flex-1 rounded border px-3 py-2"
                style={{ borderColor: "var(--border)" }}
                value={todoText}
                onChange={(e) => setTodoText(e.target.value)}
                placeholder="タスクを入力…"
              />
              <button
                className="rounded px-3 py-2 text-white"
                style={{ background: "var(--primary)" }}
                onClick={() => {
                  const t = todoText.trim();
                  if (!t) return;
                  const next = [{ id: Date.now(), text: t, done: false }, ...todos];
                  setTodos(next);
                  commit({ todos: next });
                  setTodoText("");
                }}
              >
                追加
              </button>
            </div>

            <ul className="mt-3 space-y-2">
              {todos.map((t) => (
                <li key={t.id} className="flex items-center justify-between rounded border px-3 py-2" style={{ borderColor: "var(--border)", background: "#fff" }}>
                  <button
                    className="flex items-center gap-2 text-left"
                    onClick={() => {
                      const next = todos.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x));
                      setTodos(next);
                      commit({ todos: next });
                    }}
                  >
                    <span>{t.done ? "☑️" : "⬜️"}</span>
                    <span className={t.done ? "line-through opacity-50" : ""}>{t.text}</span>
                  </button>

                  <button
                    className="text-sm underline opacity-70"
                    onClick={() => {
                      const next = todos.filter((x) => x.id !== t.id);
                      setTodos(next);
                      commit({ todos: next });
                    }}
                  >
                    削除
                  </button>
                </li>
              ))}
            </ul>

            <button
              className="mt-4 w-full rounded px-3 py-2 border"
              style={{ borderColor: "var(--border)" }}
              onClick={carryOver}
            >
              未完了を翌日に持ち越す
            </button>
          </Card>
        )}

        {/* CLEANING */}
        {section === "cleaning" && (
          <Card>
            <Title>掃除マップ</Title>
            <div className="mt-2 text-sm opacity-70">
              部屋をクリックすると中央に○がつきます
            </div>

            <div className="mt-4 flex justify-center">
              <svg width="300" height="340" viewBox="0 0 300 340" className="border rounded" style={{ borderColor: "var(--border)", background: "#fff" }}>
                {Object.entries(AREAS).map(([k, a]) => (
                  <g key={k}>
                    <rect
                      x={a.x}
                      y={a.y}
                      width={a.w}
                      height={a.h}
                      fill="#fff"
                      stroke="#000"
                      strokeWidth={1}
                      onClick={() => toggleArea(k)}
                      style={{ cursor: "pointer" }}
                    />
                    <text x={a.x + a.w / 2} y={a.y + a.h / 2} textAnchor="middle" dominantBaseline="middle" fontSize={12}>
                      {a.label}
                    </text>
                    {cleaning?.[k] && (
                      <text
                        x={a.x + a.w / 2}
                        y={a.y + a.h / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={18}
                        fill="#16a34a"
                      >
                        ○
                      </text>
                    )}
                  </g>
                ))}
              </svg>
            </div>

            <button
              className="mt-4 w-full rounded px-3 py-2 border"
              style={{ borderColor: "var(--border)" }}
              onClick={() => {
                setCleaning({});
                commit({ cleaning: {} });
              }}
            >
              リセット
            </button>
          </Card>
        )}

        {/* MONEY */}
        {section === "money" && (
          <Card>
            <Title>家計簿（明細）</Title>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <label className="text-sm opacity-70">金額（円）</label>
                <input
                  className="mt-1 w-full rounded border px-3 py-2"
                  style={{ borderColor: "var(--border)" }}
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="例：1200"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm opacity-70">メモ（任意）</label>
                <input
                  className="mt-1 w-full rounded border px-3 py-2"
                  style={{ borderColor: "var(--border)" }}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="例：コンビニ / 日用品"
                />
              </div>
            </div>

            <button
              className="mt-3 w-full rounded px-3 py-2 text-white"
              style={{ background: "var(--primary)" }}
              onClick={() => {
                const a = Math.floor(Number(amount));
                if (!Number.isFinite(a) || a <= 0) return;
                const item: ExpenseItem = { id: Date.now(), amount: a, note: note.trim() || undefined, createdAt: Date.now() };
                const next = [...expenses, item];
                setExpenses(next);
                commit({ expenses: next });
                setAmount("");
                setNote("");
              }}
            >
              追加
            </button>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="rounded border p-3" style={{ borderColor: "var(--border)", background: "#fff" }}>
                <div className="text-xs opacity-70">今日の合計</div>
                <div className="text-xl font-semibold" style={{ color: "var(--primary)" }}>
                  ¥{dayTotal.toLocaleString()}
                </div>
              </div>
              <div className="rounded border p-3" style={{ borderColor: "var(--border)", background: "#fff" }}>
                <div className="text-xs opacity-70">今月の合計</div>
                <div className="text-xl font-semibold" style={{ color: "var(--primary)" }}>
                  ¥{monthlyTotal.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {expenses.length === 0 ? (
                <div className="text-sm opacity-70">まだ明細がありません。</div>
              ) : (
                expenses
                  .slice()
                  .sort((a, b) => a.createdAt - b.createdAt)
                  .map((it) => (
                    <div key={it.id} className="rounded border px-3 py-2 flex items-center justify-between" style={{ borderColor: "var(--border)", background: "#fff" }}>
                      <div className="min-w-0">
                        <div className="font-medium">¥{it.amount.toLocaleString()}</div>
                        {it.note && <div className="text-xs opacity-70 truncate">{it.note}</div>}
                      </div>
                      <button
                        className="text-sm underline opacity-70"
                        onClick={() => {
                          const next = expenses.filter((x) => x.id !== it.id);
                          setExpenses(next);
                          commit({ expenses: next });
                        }}
                      >
                        削除
                      </button>
                    </div>
                  ))
              )}
            </div>
          </Card>
        )}

        {/* PHOTO */}
        {section === "photo" && (
          <Card>
            <Title>写真・メモ</Title>

            {/* 写真 */}
            <div className="mt-3 flex flex-col items-center">
              {photo ? (
                <div className="space-y-2 text-center">
                  <img src={photo} alt="photo" className="w-56 h-56 object-cover rounded-lg border" style={{ borderColor: "var(--border)" }} />
                  <div className="flex gap-2 justify-center">
                    <label className="px-3 py-2 rounded border cursor-pointer" style={{ borderColor: "var(--border)" }}>
                      写真を差し替え
                      <input type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
                    </label>
                    <button className="px-3 py-2 rounded border" style={{ borderColor: "var(--border)" }} onClick={removePhoto}>
                      削除
                    </button>
                  </div>
                </div>
              ) : (
                <label className="px-3 py-2 rounded border cursor-pointer" style={{ borderColor: "var(--border)" }}>
                  写真を追加
                  <input type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
                </label>
              )}
            </div>

            {/* メモ（中央寄せ + 鉛筆がはみ出ない） */}
            <div className="mt-4">
              {!editingMemo && memo ? (
                <div className="relative max-w-md mx-auto text-center px-10">
                  <p className="text-sm whitespace-pre-line leading-7">{memo}</p>
                  <button
                    className="absolute right-2 top-0 opacity-80"
                    style={{ color: "var(--primary)" }}
                    onClick={() => setEditingMemo(true)}
                    aria-label="edit memo"
                    title="編集"
                  >
                    ✏️
                  </button>
                </div>
              ) : (
                <div className="max-w-md mx-auto">
                  <textarea
                    className="w-full rounded border p-3 text-sm"
                    style={{ borderColor: "var(--border)", background: "#fff" }}
                    rows={4}
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="今日のコメント…"
                  />
                  <button
                    className="mt-2 w-full rounded px-3 py-2 text-white"
                    style={{ background: "var(--primary)" }}
                    onClick={saveMemoOnly}
                  >
                    保存
                  </button>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
