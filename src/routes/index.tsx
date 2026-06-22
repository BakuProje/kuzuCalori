import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ClayBackdrop } from "@/components/ClayBackdrop";
import { NavBar } from "@/components/NavBar";
import {
  calcBMR,
  calcDaily,
  calcRecommended,
  getProfile,
  saveProfile,
  getBMIDetails,
  type Goal,
  type Profile,
} from "@/lib/profile";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Kcal — Hitung Kalori Makanan dengan AI" },
      {
        name: "description",
        content:
          "Hitung kalori makanan dari foto dan kebutuhan kalori harianmu. Desain clay 3D yang lembut dan menyenangkan.",
      },
    ],
  }),
});

const goals: { value: Goal; label: string; bg: string }[] = [
  { value: "maintain", label: "Stabilkan", bg: "var(--clay-mint)" },
  { value: "lose", label: "Turunkan", bg: "var(--clay-pink)" },
  { value: "gain", label: "Naikkan", bg: "var(--clay-peach)" },
];

function Index() {
  const navigate = useNavigate();
  const [form, setForm] = useState<Profile>({
    name: "",
    age: 25,
    weight: 60,
    height: 165,
    gender: "female",
    goal: "maintain",
    targetWeight: 60,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState<Profile | null>(null);

  useEffect(() => {
    const p = getProfile();
    if (p) {
      setForm(p);
      setSaved(p);
    }
  }, []);

  const onChange = <K extends keyof Profile>(k: K, v: Profile[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onNumberChange = (k: keyof Profile, val: string) => {
    const n = parseInt(val.replace(/^0+/, "") || "0", 10);
    onChange(k, n);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    saveProfile(form);
    setSaved(form);
    setIsEditing(false);
    navigate({ to: "/" });
  };

  const bmr = saved ? calcBMR(saved) : 0;
  const daily = saved ? calcDaily(saved) : 0;
  const rec = saved ? calcRecommended(saved) : 0;
  const bmiDetails = saved ? getBMIDetails(saved.weight, saved.height) : null;
  const fmt = (n: number) => new Intl.NumberFormat("id-ID").format(n);

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50/50 relative overflow-x-hidden">
      <ClayBackdrop />

      <main className="mx-auto mt-10 flex-1 w-full max-w-5xl grid gap-8 px-4 md:grid-cols-2">
        {/* RIGHT (STATS) - Now Order 1 on mobile, 2 on desktop */}
        <section className="space-y-6 order-1 md:order-2">
          {saved ? (
            <>
              <div
                className="clay relative overflow-hidden p-7"
                style={{ background: "var(--clay-peach)" }}
              >
                <div className="text-sm font-semibold opacity-70">Kebutuhan Harianmu</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <div className="text-5xl font-extrabold">{fmt(rec)}</div>
                  <div className="text-sm font-semibold opacity-70">kcal/hari</div>
                </div>
                <p className="mt-2 text-sm opacity-80">
                  Rekomendasi berdasarkan tujuanmu.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Stat label="BMR" value={bmr} unit="kcal" bg="var(--clay-mint)" />
                <Stat
                  label="Aktivitas Sedang"
                  value={daily}
                  unit="kcal"
                  bg="var(--clay-lavender)"
                />
              </div>
            </>
          ) : (
            <div
              className="clay relative overflow-hidden p-7"
              style={{ background: "var(--clay-lavender)" }}
            >
              <div className="text-sm font-semibold opacity-70">Belum ada data</div>
              <div className="mt-2 text-2xl font-extrabold leading-tight">
                Isi datamu dulu ya
              </div>
              <p className="mt-2 text-sm opacity-80">
                Rekomendasi kalori & fitur foto makanan akan terbuka setelah kamu
                menyimpan profil di samping.
              </p>
            </div>
          )}

          <div className="clay p-6">
            <div className="text-sm font-semibold">Bagaimana kami menghitung?</div>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>• BMR pakai rumus Mifflin–St Jeor.</li>
              <li>• Kebutuhan harian = BMR × 1.55 (aktivitas sedang).</li>
              <li>• Turun/Naik berat = ±500 kcal dari kebutuhan harian.</li>
            </ul>
          </div>
        </section>

        {/* LEFT (PROFILE) - Now Order 2 on mobile, 1 on desktop */}
        <section className="clay p-7 md:p-9 h-fit order-2 md:order-1">
          {saved && !isEditing ? (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Profil Kamu</div>
                <h1 className="text-4xl font-extrabold text-primary mt-1">{saved.name}</h1>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="clay-inset p-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-50">Kondisi</div>
                  <div className="mt-1 font-bold">{saved.age} th · {saved.gender === 'male' ? 'Pria' : 'Wanita'}</div>
                </div>
                <div className="clay-inset p-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-50">Postur</div>
                  <div className="mt-1 font-bold">{saved.weight}kg · {saved.height}cm</div>
                </div>
              </div>

              {bmiDetails && (
                <div className="clay-inset p-4 transition-all duration-300" style={{ background: bmiDetails.bg }}>
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">Status BMI</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-xl font-black" style={{ color: bmiDetails.color }}>
                      {bmiDetails.label}
                    </span>
                    <span className="text-sm font-bold opacity-60">({bmiDetails.bmi})</span>
                  </div>
                  <p className="mt-1 text-xs opacity-75 leading-relaxed">{bmiDetails.description}</p>
                </div>
              )}

              <div className="clay-inset p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-50">Tujuan</div>
                <div className="mt-1 font-bold">
                  {saved.goal === 'lose' ? 'Turunkan Berat' : saved.goal === 'gain' ? 'Naikkan Berat' : 'Stabilkan Berat'}
                  {saved.targetWeight && ` (ke ${saved.targetWeight}kg)`}
                </div>
              </div>

              <button
                onClick={() => setIsEditing(true)}
                className="clay-btn w-full flex items-center justify-center gap-2 group"
                style={{ background: 'var(--clay-lavender)' }}
              >
                <span>Edit Data Profil</span>
              </button>
            </div>
          ) : (
            <>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[var(--clay-mint)] px-3 py-1 text-xs font-semibold">
                Mulai di sini
              </div>
              <h1 className="text-3xl font-extrabold leading-tight md:text-4xl">
                Kenalan dulu, yuk! <br />
                <span style={{ color: "var(--primary)" }}>
                  Biar kalorimu pas.
                </span>
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Isi datamu untuk membuka fitur foto makanan & rekomendasi kalori
                harian yang dipersonalisasi.
              </p>

              <form onSubmit={submit} className="mt-6 space-y-4">
                <ProfileForm form={form} onChange={onChange} onNumberChange={onNumberChange} />
                <button
                  type="submit"
                  className="clay-btn mt-2 w-full text-base"
                  style={{ background: "var(--clay-pink)", color: "white" }}
                >
                  Simpan & Mulai Hitung Kalori
                </button>
              </form>
            </>
          )}
        </section>
      </main>

      {/* EDIT MODAL */}
      {isEditing && saved && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setIsEditing(false)} />
          <div className="clay relative w-full max-w-xl p-8 bg-white overflow-y-auto max-h-[90vh] shadow-2xl">
            <button
              onClick={() => setIsEditing(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-2xl font-extrabold mb-6">Ubah Data Profil</h2>
            <form onSubmit={submit} className="space-y-4">
              <ProfileForm form={form} onChange={onChange} onNumberChange={onNumberChange} />
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="clay-btn flex-1"
                  style={{ background: 'var(--muted)' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="clay-btn flex-[2] text-white"
                  style={{ background: "var(--clay-pink)" }}
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <NavBar />
    </div>
  );
}

function ProfileForm({ form, onChange, onNumberChange }: {
  form: Profile;
  onChange: any;
  onNumberChange: any
}) {
  return (
    <>
      <Field label="Nama">
        <input
          className="clay-input"
          value={form.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="Nama panggilan"
          required
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Usia">
          <input
            type="number"
            min={10}
            max={100}
            className="clay-input"
            value={form.age || ""}
            onChange={(e) => onNumberChange("age", e.target.value)}
          />
        </Field>
        <Field label="Jenis Kelamin">
          <div className="flex gap-2">
            {(["female", "male"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => onChange("gender", g)}
                className="clay-btn flex-1 text-sm"
                style={{
                  background:
                    form.gender === g
                      ? "var(--clay-lavender)"
                      : "var(--card)",
                }}
              >
                {g === "female" ? "Wanita" : "Pria"}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Berat (kg)">
          <input
            type="number"
            min={20}
            max={300}
            className="clay-input"
            value={form.weight || ""}
            onChange={(e) => onNumberChange("weight", e.target.value)}
          />
        </Field>
        <Field label="Tinggi (cm)">
          <input
            type="number"
            min={100}
            max={250}
            className="clay-input"
            value={form.height || ""}
            onChange={(e) => onNumberChange("height", e.target.value)}
          />
        </Field>
      </div>

      {/* Real-time BMI Indicator */}
      {(() => {
        const details = getBMIDetails(form.weight, form.height);
        if (!details) return null;
        return (
          <div className="clay-inset p-4 transition-all duration-300 animate-in fade-in slide-in-from-top-2" style={{ background: details.bg }}>
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">Pratinjau Status BMI Anda</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black" style={{ color: details.color }}>
                {details.label}
              </span>
              <span className="text-sm font-bold opacity-60">({details.bmi})</span>
            </div>
            <p className="mt-1 text-xs opacity-75 leading-relaxed">{details.description}</p>
          </div>
        );
      })()}

      {(form.goal === "lose" || form.goal === "gain") && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <Field label={`Ke Berat Badan Berapa? (${form.goal === "lose" ? "Turun" : "Naik"})`}>
            <input
              type="number"
              min={20}
              max={300}
              className="clay-input"
              value={form.targetWeight || ""}
              onChange={(e) => onNumberChange("targetWeight", e.target.value)}
              placeholder="Contoh: 55"
            />
          </Field>
        </div>
      )}

      <Field label="Tujuan">
        <div className="grid grid-cols-3 gap-2">
          {goals.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => onChange("goal", g.value)}
              className="clay-btn flex flex-col items-center gap-1 text-xs"
              style={{
                background: form.goal === g.value ? g.bg : "var(--card)",
              }}
            >
              {g.label}
            </button>
          ))}
        </div>
      </Field>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      {children}
    </label>
  );
}

function Stat({
  label,
  value,
  unit,
  bg,
}: {
  label: string;
  value: number;
  unit: string;
  bg: string;
}) {
  return (
    <div className="clay p-5" style={{ background: bg }}>
      <div className="text-xs font-semibold opacity-70">{label}</div>
      <div className="mt-1 text-2xl font-extrabold">
        {new Intl.NumberFormat("id-ID").format(value)}
        <span className="ml-1 text-xs font-semibold opacity-70">{unit}</span>
      </div>
    </div>
  );
}
