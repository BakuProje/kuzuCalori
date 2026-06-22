import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ClayBackdrop } from "@/components/ClayBackdrop";
import { NavBar } from "@/components/NavBar";
import { calcRecommended, getProfile, type Profile } from "@/lib/profile";
import {
  addEntry,
  deleteEntry,
  getEntriesByDate,
  todayKey,
  updateEntry,
  type FoodEntry,
} from "@/lib/foods";
import { analyzeFood } from "@/lib/ai-vision.functions";
import {
  Camera,
  ChevronRight,
  Download,
  Eye,
  History,
  Loader2,
  Pencil,
  Trash2,
  TrendingUp,
  Upload,
  X,
} from "lucide-react";
import { formatPortionLabel } from "@/lib/utils";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/app")({
  component: AppPage,
  head: () => ({
    meta: [
      { title: "Kcal" },
      {
        name: "description",
        content: "Ambil atau unggah foto makanan untuk dianalisis AI menjadi estimasi kalori.",
      },
    ],
  }),
});

function AppPage() {
  const navigate = useNavigate();
  const analyze = useServerFn(analyzeFood);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [statusIdx, setStatusIdx] = useState(0);
  const [fakeProgress, setFakeProgress] = useState(0);
  const [mounted, setMounted] = useState(false);

  const statuses = [
    "Menganalisis gambar...",
    "Mengenali makanan...",
    "Menghitung kalori...",
    "Menyusun hasil nutrisi...",
  ];

  const [cameraOn, setCameraOn] = useState(false);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setMounted(true);
    const p = getProfile();
    if (p) {
      setProfile(p);
      setEntries(getEntriesByDate(todayKey()));
    }
  }, []);

  const refresh = () => setEntries(getEntriesByDate(todayKey()));

  const total = entries.reduce((s, e) => s + e.calories, 0);
  const rec = profile ? calcRecommended(profile) : 0;
  const remaining = rec - total;
  const pct = rec > 0 ? Math.min(100, Math.round((total / rec) * 100)) : 0;

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      setCameraOn(true);
      // give DOM a tick to mount the <video>
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => { });
        }
      }, 50);
    } catch {
      setError("Tidak bisa mengakses kamera. Coba unggah foto saja.");
    }
  };

  const stopCamera = () => {
    try {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch (e) {
            console.error("Error stopping individual track:", e);
          }
        });
      }
    } catch (e) {
      console.error("Error in stopCamera:", e);
    } finally {
      streamRef.current = null;
      setCameraOn(false);
    }
  };

  useEffect(() => () => stopCamera(), []);

  useEffect(() => {
    if (!viewImage) return;
    const y = window.scrollY;
    const html = document.documentElement;
    const body = document.body;
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
      bodyWidth: body.style.width,
    };
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${y}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";

    return () => {
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
      body.style.position = prev.bodyPosition;
      body.style.top = prev.bodyTop;
      body.style.left = prev.bodyLeft;
      body.style.right = prev.bodyRight;
      body.style.width = prev.bodyWidth;
      window.scrollTo(0, y);
    };
  }, [viewImage]);

  const snap = () => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext("2d")?.drawImage(v, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    stopCamera();
    runAnalyze(dataUrl);
  };

  const onFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = () => runAnalyze(reader.result as string);
    reader.readAsDataURL(f);
  };

  const runAnalyze = async (dataUrl: string) => {
    setError(null);
    setPreview(dataUrl);
    setBusy(true);
    setFakeProgress(0);
    setStatusIdx(0);

    // Fake progress & status cycling
    const progInt = setInterval(() => {
      setFakeProgress((p) => (p < 90 ? p + Math.random() * 15 : p));
    }, 400);

    const statusInt = setInterval(() => {
      setStatusIdx((i) => (i + 1) % statuses.length);
    }, 1500);

    try {
      const result = await analyze({ data: { imageBase64: dataUrl } });
      clearInterval(progInt);
      clearInterval(statusInt);
      setFakeProgress(100);

      if (!result.recognized) {
        setError("Makanan tidak dikenali, coba foto lain.");
      } else {
        addEntry({
          date: todayKey(),
          name: result.name,
          calories: result.calories,
          portion: result.portion,
          imageUrl: dataUrl,
          items: result.items,
        });
        refresh();
      }
    } catch (e) {
      clearInterval(progInt);
      clearInterval(statusInt);
      setError(e instanceof Error ? e.message : "Gagal menganalisis foto.");
    } finally {
      setTimeout(() => {
        setBusy(false);
        setPreview(null);
      }, 800);
    }
  };

  if (!profile) {
    return (
      <div className="flex min-h-dvh flex-col bg-slate-50/50">
        <ClayBackdrop />
        <main className="mx-auto mt-16 flex-1 w-full max-w-xl px-4">
          <div className="clay p-8 text-center">
            <h1 className="mt-3 text-2xl font-extrabold">Lengkapi profil dulu</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Fitur foto makanan & rekomendasi kalori akan terbuka setelah kamu
              mengisi data diri.
            </p>
            <button type="button"
              onClick={() => navigate({ to: "/" })}
              className="clay-btn mt-6"
              style={{ background: "var(--clay-pink)", color: "var(--primary-foreground)" }}
            >
              Isi profil sekarang
            </button>
          </div>
        </main>
        <NavBar />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50/50 relative overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] rounded-full bg-blue-400/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[35rem] h-[35rem] rounded-full bg-cyan-400/10 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[10%] w-[20rem] h-[20rem] rounded-full bg-purple-400/5 blur-[80px]" />
      </div>

      <ClayBackdrop />

      <main className="z-10 mx-auto mt-1 flex-1 w-full flex flex-col gap-3 px-3 pb-3 sm:mt-3 sm:gap-4 sm:px-4 sm:pb-4 lg:mt-5 lg:grid lg:grid-cols-[1.15fr_1fr] lg:gap-6 lg:px-5">
        {/* LEFT: capture + analysis */}
        <section className="z-10 space-y-3 sm:space-y-4">
          <div className="glass-overlay clay group relative overflow-hidden p-4 sm:p-5 md:p-6">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/5 blur-3xl transition-transform group-hover:scale-150 duration-1000" />

            <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end md:gap-4">
              <div>
                <div className="mb-1.5 flex items-center gap-2 sm:mb-2">
                  <div className="h-1 w-8 rounded-full bg-primary" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Hari ini</span>
                </div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl md:text-4xl">
                  Halo, <span className="text-primary">{profile.name.split(" ")[0]}</span>!
                </h1>
                <p className="mt-1 max-w-sm text-xs font-medium leading-relaxed text-slate-500 sm:mt-2 sm:text-sm">
                  Unggah atau ambil foto untuk estimasi kalori.
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-row gap-2 sm:mt-4 sm:gap-2.5">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="clay-btn group flex min-h-[48px] min-w-0 flex-1 flex-row items-center justify-center gap-2 !py-3 shadow-lg transition-all hover:translate-y-[-1px] whitespace-nowrap"
                style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "white" }}
                disabled={busy}
              >
                <div className="shrink-0 rounded-xl bg-white/20 p-1.5 sm:p-2">
                  <Upload className="h-4 w-4" />
                </div>
                <span className="truncate font-black text-[11px] uppercase tracking-wide sm:text-xs">Upload</span>
              </button>

              <button
                type="button"
                onClick={cameraOn ? stopCamera : startCamera}
                className="clay-btn group flex min-h-[48px] min-w-0 flex-1 flex-row items-center justify-center gap-2 !py-3 shadow-lg transition-all hover:translate-y-[-1px] whitespace-nowrap"
                style={{ background: "linear-gradient(135deg, #06b6d4, #0891b2)", color: "white" }}
                disabled={busy}
              >
                <div className="shrink-0 rounded-xl bg-white/20 p-1.5 sm:p-2">
                  <Camera className="h-4 w-4" />
                </div>
                <span className="truncate font-black text-[11px] uppercase tracking-wide sm:text-xs">
                  {cameraOn ? "Tutup" : "Ambil foto"}
                </span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onFile(f);
                  e.target.value = "";
                }}
              />
            </div>

            <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
              {busy && preview && (
                <div className="clay-soft p-2 bg-white/40 backdrop-blur-xl border border-white/40 shadow-2xl animate-in zoom-in-95 duration-500">
                  <InlineScanning
                    image={preview}
                    status={statuses[statusIdx]}
                    progress={fakeProgress}
                  />
                </div>
              )}

              {error && (
                <div
                  className="clay-soft flex items-start gap-3 p-4 text-sm animate-in fade-in slide-in-from-top-2"
                  style={{ background: "oklch(0.92 0.07 25)" }}
                >
                  <X className="mt-0.5 h-4 w-4" />
                  <div className="font-semibold">{error}</div>
                </div>
              )}
            </div>

            {cameraOn && (
              <div className="clay-inset mt-5 overflow-hidden p-2">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="aspect-video w-full rounded-2xl bg-black object-cover"
                />
                <div className="mt-3 flex justify-center">
                  <button type="button"
                    onClick={snap}
                    className="clay-btn"
                    style={{ background: "var(--clay-peach)" }}
                  >
                    Ambil Foto
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Today's foods */}
          <div className="clay p-3 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4 sm:gap-3">
              <h2 className="text-xl font-black tracking-tight text-slate-900">Makanan Hari Ini</h2>
              <Link
                to="/history"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary ring-1 ring-primary/15 transition-colors active:bg-primary/15"
              >
                <History className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2.25} />
                <span>Riwayat</span>
                <ChevronRight className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
              </Link>
            </div>
            {entries.length === 0 ? (
              <div className="clay-inset mt-4 p-6 text-center text-sm text-muted-foreground">
                Belum ada catatan. Yuk foto makanan pertamamu!
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {entries.map((e) => (
                  <FoodCard
                    key={e.id}
                    entry={e}
                    onChange={refresh}
                    onViewImage={(url) => setViewImage(url)}
                  />
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* RIGHT: stats */}
        <section className="z-10 space-y-3 sm:space-y-4">
          <div className="glass-overlay clay group relative overflow-hidden p-4 sm:p-5 md:p-6">
            <div className="absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-secondary/10 blur-3xl group-hover:scale-125 transition-transform duration-1000" />

            <div className="relative">
              <div className="mb-4 flex items-center justify-between sm:mb-5">
                <div>
                  <h2 className="text-xl font-black text-slate-900 md:text-2xl">Ringkasan Kalori</h2>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] opacity-30">Ringkasan hari ini</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 shadow-inner">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>

              <div className="space-y-4 sm:space-y-5">
                <div className="clay-inset flex flex-col items-center bg-white/40 p-4 sm:p-6 md:p-7">
                  <div className="mb-2 text-center text-[10px] font-black uppercase tracking-[0.25em] opacity-30">
                    Sisa Kalori Hari Ini
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black tracking-tighter text-primary tabular-nums md:text-6xl">
                      {Math.max(0, rec - total).toLocaleString("id-ID")}
                    </span>
                    <span className="text-xs font-black uppercase tracking-widest opacity-30">kcal</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-end justify-between px-1">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Progres</span>
                    <span className="text-sm font-black text-primary">{Math.round(pct)}%</span>
                  </div>
                  <ClayProgress pct={pct} />
                  <div className="flex justify-between text-[10px] font-bold opacity-30 uppercase tracking-tighter">
                    <span>{total.toLocaleString()} kcal masuk</span>
                    <span>Target {rec.toLocaleString()} kcal</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="clay-inset flex flex-col items-center justify-center bg-white/40 p-4 text-center">
                    <div className="mb-2 text-[9px] font-black uppercase tracking-wider opacity-40">Total hari ini</div>
                    <div className="flex flex-col items-center">
                      <span className="text-3xl font-black tracking-tight text-slate-900 leading-none">
                        {total.toLocaleString()}
                      </span>
                      <span className="mt-1.5 text-[10px] font-black uppercase tracking-[0.2em] opacity-30">kcal</span>
                    </div>
                  </div>
                  <div className="clay-inset flex flex-col items-center justify-center bg-white/40 p-4 text-center">
                    <div className="mb-2 text-[9px] font-black uppercase tracking-wider opacity-40">Jumlah item</div>
                    <div className="flex flex-col items-center">
                      <span className="text-3xl font-black tracking-tight text-slate-900 leading-none">
                        {entries.length}
                      </span>
                      <span className="mt-1.5 text-[10px] font-black uppercase tracking-[0.2em] opacity-30">makanan</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* VIEW IMAGE MODAL — tengah layar, latar tidak ikut scroll */}
      {mounted && viewImage && createPortal(
        <div className="fixed inset-0 z-[120] flex w-full items-center justify-center overflow-hidden overscroll-none p-4 animate-in fade-in duration-300 sm:p-6">
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setViewImage(null)}
            aria-hidden
          />
          <div
            className="clay relative z-10 flex w-full max-w-lg flex-col overflow-y-auto overscroll-y-contain rounded-3xl bg-white p-4 shadow-2xl ring-1 ring-slate-200/80 animate-in zoom-in-95 duration-300 sm:p-5"
            style={{ maxHeight: "min(80dvh, 580px)" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="image-preview-title"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="image-preview-title" className="text-base font-black text-slate-900 sm:text-lg">
                Pratinjau foto
              </h2>
              <button
                type="button"
                onClick={() => setViewImage(null)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200"
                aria-label="Tutup"
              >
                <X className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>

            <div className="relative w-full overflow-hidden rounded-2xl bg-black">
              <img
                src={viewImage}
                alt="Pratinjau makanan"
                className="max-h-[38dvh] sm:max-h-[48dvh] w-full object-contain"
              />
            </div>

            <div className="mt-4 flex flex-row gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setViewImage(null)}
                className="clay-btn min-h-[48px] min-w-0 flex-1 font-semibold"
                style={{ background: "var(--muted)" }}
              >
                Tutup
              </button>
              <a
                href={viewImage}
                download="kcal-food-analysis.png"
                className="clay-btn flex min-h-[48px] min-w-0 flex-[1.35] items-center justify-center gap-2 font-black text-white shadow-lg ring-2 ring-emerald-400/70"
                style={{
                  background: "linear-gradient(135deg, #059669 0%, #0d9488 45%, #0891b2 100%)",
                  boxShadow: "0 4px 14px rgba(5, 150, 105, 0.45)",
                }}
              >
                <Download className="h-5 w-5 shrink-0" strokeWidth={2.5} />
                <span className="truncate sm:whitespace-normal">Unduh</span>
              </a>
            </div>
          </div>
        </div>,
        document.body
      )}

      <NavBar />
    </div>
  );
}

function ClayProgress({ pct }: { pct: number }) {
  return (
    <div className="clay-inset h-5 w-full overflow-hidden p-1">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${pct}%`,
          background:
            "linear-gradient(90deg, var(--clay-pink), var(--clay-peach))",
          boxShadow:
            "inset 0 2px 4px oklch(1 0 0 / 0.6), 0 2px 6px oklch(0.78 0.04 290 / 0.4)",
        }}
      />
    </div>
  );
}

function FoodCard({
  entry,
  onChange,
  onViewImage,
}: {
  entry: FoodEntry;
  onChange: () => void;
  onViewImage: (url: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(entry.name);
  const [cal, setCal] = useState(entry.calories);

  const save = () => {
    updateEntry(entry.id, { name, calories: Number(cal) });
    setEditing(false);
    onChange();
  };

  return (
    <li className="clay-soft animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden rounded-[1.25rem] p-4 ring-1 ring-slate-200/50 sm:p-5">
      <div className="flex flex-col gap-4">
        {entry.imageUrl ? (
          <button
            type="button"
            className="group relative -mx-1 -mt-1 w-full overflow-hidden rounded-2xl text-left ring-1 ring-black/5 sm:mx-0 sm:mt-0 sm:max-w-[200px] sm:self-start"
            onClick={() => onViewImage(entry.imageUrl!)}
          >
            <img
              src={entry.imageUrl}
              alt={entry.name}
              className="aspect-[16/10] w-full object-cover transition duration-300 group-active:scale-[1.02] sm:aspect-square sm:h-28 sm:w-28 sm:max-w-none"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent opacity-80 sm:opacity-100" />
            <div className="pointer-events-none absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-md backdrop-blur-sm sm:bottom-1.5 sm:right-1.5">
              <Eye className="h-4 w-4" strokeWidth={2.25} />
            </div>
          </button>
        ) : (
          <div className="clay-inset flex aspect-[16/10] w-full items-center justify-center rounded-2xl bg-slate-50 text-3xl sm:aspect-square sm:h-28 sm:w-28 sm:max-w-[200px] sm:self-start">
            🍽️
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="flex flex-col gap-2">
                <input
                  className="clay-input !p-2 !text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <input
                  type="number"
                  className="clay-input !w-full !p-2 !text-sm"
                  value={cal}
                  onChange={(e) => setCal(Number(e.target.value))}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <div className="text-[17px] font-black leading-snug text-slate-900">{entry.name}</div>
                <p className="text-[13px] font-medium leading-relaxed text-slate-500 line-clamp-3">
                  {formatPortionLabel(entry.portion || "1 porsi")}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-row flex-wrap items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-start">
            {!editing && (
              <div className="text-2xl font-black tabular-nums text-primary sm:text-right">
                {entry.calories}
                <span className="ml-1 text-xs font-bold text-primary/55">kcal</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              {editing ? (
                <button
                  type="button"
                  onClick={save}
                  className="min-h-[44px] rounded-2xl bg-primary px-5 text-xs font-black uppercase tracking-widest text-primary-foreground shadow-md active:scale-[0.98]"
                >
                  Simpan
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 ring-1 ring-sky-100 transition-colors active:bg-sky-100"
                  aria-label="Edit"
                >
                  <Pencil className="h-4 w-4" strokeWidth={2.25} />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  deleteEntry(entry.id);
                  onChange();
                }}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-100 transition-colors active:bg-rose-100"
                aria-label="Hapus"
              >
                <Trash2 className="h-4 w-4" strokeWidth={2.25} />
              </button>
            </div>
          </div>
        </div>

        {entry.items && entry.items.length > 0 && (
          <div className="clay-inset space-y-2 rounded-2xl border border-slate-100/60 bg-slate-50/50 p-3 sm:p-4">
            {entry.items.map((it, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 rounded-xl bg-white/90 px-3 py-2 text-[13px] font-semibold shadow-sm ring-1 ring-slate-100/80"
              >
                <span className="min-w-0 truncate text-slate-600">{formatPortionLabel(it.name)}</span>
                <span className="shrink-0 tabular-nums text-slate-900">{it.calories} kcal</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}
function InlineScanning({ image, status, progress }: { image: string; status: string; progress: number }) {
  return (
    <div className="clay-soft overflow-hidden p-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex flex-col items-center gap-6">

        {/* IMAGE PREVIEW */}
        <div className="shimmer-effect relative aspect-video w-full overflow-hidden rounded-[2rem] shadow-lg border-2 border-primary/10">
          <img
            src={image}
            alt="Scanning"
            className="h-full w-full scale-[1.02] object-cover transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-black/5" />

          {/* SCANNING LINE */}
          <div className="scan-line" />
        </div>

        {/* STATUS SECTION */}
        <div className="w-full space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-1">
              <h2 className="animate-pulse-text text-lg font-extrabold tracking-tight">
                {status}
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">
                Scanning makanan
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-primary">
                {Math.round(progress)}<span className="text-xs ml-0.5 opacity-50">%</span>
              </span>
            </div>
          </div>

          {/* PROGRESS BAR */}
          <div className="clay-inset h-4 w-full overflow-hidden p-1">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #00f2ff, var(--color-primary))",
                boxShadow: "0 0 15px rgba(0, 242, 255, 0.4)"
              }}
            />
          </div>

          <div className="flex justify-center pt-2">
            <div className="flex items-center gap-2.5 rounded-full bg-primary/5 px-4 py-2 border border-primary/10">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">AI Sedang Bekerja</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

