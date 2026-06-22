import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ClayBackdrop } from "@/components/ClayBackdrop";
import { NavBar } from "@/components/NavBar";
import { calcRecommended, getProfile, type Profile } from "@/lib/profile";
import {
  deleteEntry,
  getAllEntries,
  groupByDate,
  type FoodEntry,
} from "@/lib/foods";
import { Trash2 } from "lucide-react";
import { formatPortionLabel } from "@/lib/utils";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
  head: () => ({
    meta: [
      { title: "Riwayat Kalori — Kcal" },
      { name: "description", content: "Riwayat catatan kalori harian dari foto makanan." },
    ],
  }),
});

function HistoryPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [groups, setGroups] = useState<[string, FoodEntry[]][]>([]);

  const refresh = () => setGroups(groupByDate(getAllEntries()));

  useEffect(() => {
    const p = getProfile();
    if (!p) {
      navigate({ to: "/" });
      return;
    }
    setProfile(p);
    refresh();
  }, [navigate]);

  if (!profile) return null;
  const rec = calcRecommended(profile);

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50/50 relative overflow-x-hidden">
      <ClayBackdrop />
      <main className="mx-auto mt-4 flex-1 w-full max-w-4xl px-4 pb-2 sm:mt-6">
        {groups.length === 0 ? (
          <div className="clay mt-6 p-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
              📋
            </div>
            <div className="mt-4 text-lg font-black text-slate-900">Belum ada riwayat</div>
            <div className="mt-2 text-sm text-muted-foreground">
              <Link to="/app" className="font-semibold text-primary underline-offset-2 hover:underline">
                Catat makanan
              </Link>{" "}
              untuk menambah entri pertama.
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {groups.map(([date, items]) => {
              const total = items.reduce((s, e) => s + e.calories, 0);
              const remaining = rec - total;
              const pct = Math.min(100, Math.round((total / rec) * 100));
              return (
                <section
                  key={date}
                  className="clay overflow-hidden rounded-[1.35rem] p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-6"
                >
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        {formatDate(date)}
                      </div>
                      <div className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                        {total.toLocaleString("id-ID")}
                        <span className="ml-2 text-sm font-semibold text-slate-500">kcal masuk</span>
                      </div>
                    </div>
                    <div
                      className="shrink-0 rounded-full px-4 py-2 text-sm font-bold shadow-sm ring-1 ring-black/5"
                      style={{
                        background:
                          remaining < 0
                            ? "var(--clay-pink)"
                            : "var(--clay-mint)",
                      }}
                    >
                      {remaining >= 0
                        ? `Sisa ${remaining.toLocaleString("id-ID")} kcal`
                        : `Lebih ${Math.abs(remaining).toLocaleString("id-ID")} kcal`}
                    </div>
                  </div>

                  <div className="mt-5 clay-inset h-5 w-full overflow-hidden rounded-full p-1 sm:h-6">
                    <div
                      className="h-full min-w-[6px] rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition-[width] duration-500"
                      style={{
                        width: `${pct}%`,
                        background:
                          "linear-gradient(90deg, var(--clay-mint), var(--clay-peach), var(--clay-pink))",
                      }}
                    />
                  </div>

                  <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                    {items.map((e) => (
                      <li
                        key={e.id}
                        className="clay-soft flex flex-col gap-3 overflow-hidden rounded-2xl p-4 ring-1 ring-slate-200/60 sm:p-4"
                      >
                        {e.imageUrl ? (
                          <div className="relative -mx-1 -mt-1 overflow-hidden rounded-xl sm:mx-0 sm:mt-0">
                            <img
                              src={e.imageUrl}
                              alt={e.name}
                              className="aspect-[16/10] w-full object-cover sm:aspect-[4/3] sm:max-h-[140px]"
                            />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
                          </div>
                        ) : (
                          <div className="clay-inset flex aspect-[16/10] w-full items-center justify-center rounded-xl text-3xl sm:max-h-[140px]">
                            🍽️
                          </div>
                        )}

                        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="text-base font-black leading-snug text-slate-900 sm:text-[17px]">
                              {e.name}
                            </div>
                            {e.portion ? (
                              <p className="mt-1.5 text-[13px] font-medium leading-relaxed text-slate-500 line-clamp-3">
                                {formatPortionLabel(e.portion)}
                              </p>
                            ) : null}
                          </div>

                          <div className="flex shrink-0 flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
                            <div className="text-left sm:text-right">
                              <div className="text-lg font-black tabular-nums text-primary sm:text-xl">
                                {e.calories}
                                <span className="ml-1 text-xs font-bold text-primary/60">kcal</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                deleteEntry(e.id);
                                refresh();
                              }}
                              className="inline-flex h-11 min-w-[44px] items-center justify-center rounded-2xl bg-rose-50 px-4 text-rose-600 ring-1 ring-rose-100 transition-colors active:bg-rose-100 sm:h-11 sm:w-11 sm:px-0"
                              aria-label="Hapus entri"
                            >
                              <Trash2 className="h-5 w-5" strokeWidth={2} />
                            </button>
                          </div>
                        </div>

                        {e.items && e.items.length > 0 && (
                          <div className="clay-inset space-y-2 rounded-2xl bg-slate-50/80 p-3 ring-1 ring-slate-100">
                            {e.items.map((it, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between gap-2 text-[13px] font-semibold"
                              >
                                <span className="min-w-0 truncate text-slate-600">
                                  {formatPortionLabel(it.name)}
                                </span>
                                <span className="shrink-0 tabular-nums text-slate-900">
                                  {it.calories} kcal
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </main>
      <NavBar />
    </div>
  );
}

function formatDate(d: string) {
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return d;
  }
}
