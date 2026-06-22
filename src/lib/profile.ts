export type Goal = "maintain" | "lose" | "gain";

export interface Profile {
  name: string;
  age: number;
  weight: number; // kg
  height: number; // cm
  gender: "male" | "female";
  goal: Goal;
  targetWeight?: number; // target kg
}

const KEY = "kalori_profile";

export function getProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

export function saveProfile(p: Profile) {
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function clearProfile() {
  localStorage.removeItem(KEY);
}

// Mifflin–St Jeor
export function calcBMR(p: Profile): number {
  const base = 10 * p.weight + 6.25 * p.height - 5 * p.age;
  return Math.round(p.gender === "male" ? base + 5 : base - 161);
}

// Aktivitas sedang = 1.55
export function calcDaily(p: Profile): number {
  return Math.round(calcBMR(p) * 1.55);
}

export function calcRecommended(p: Profile): number {
  const d = calcDaily(p);
  if (p.goal === "lose") return d - 500;
  if (p.goal === "gain") return d + 500;
  return d;
}

export function calcBMI(weight: number, height: number): number {
  if (!weight || !height) return 0;
  const heightMeters = height / 100;
  return Number((weight / (heightMeters * heightMeters)).toFixed(1));
}

export type BMICategory = "kurus" | "normal" | "gemuk" | "obesitas";

export interface BMIDetails {
  bmi: number;
  category: BMICategory;
  label: string;
  color: string;
  description: string;
  bg: string;
}

export function getBMIDetails(weight: number, height: number): BMIDetails | null {
  const bmi = calcBMI(weight, height);
  if (bmi === 0) return null;

  let category: BMICategory = "normal";
  let label = "Normal";
  let color = "oklch(0.62 0.17 150)"; // Vibrant Emerald
  let bg = "var(--clay-mint)";
  let description = "Berat badan Anda ideal. Pertahankan pola makan sehat dan aktivitas fisik Anda.";

  if (bmi < 18.5) {
    category = "kurus";
    label = "Kurus (Underweight)";
    color = "oklch(0.58 0.16 230)"; // Cool Sky Blue
    bg = "var(--clay-sky)";
    description = "Berat badan Anda di bawah rata-rata. Cobalah untuk makan lebih teratur dengan gizi seimbang.";
  } else if (bmi >= 25 && bmi < 30) {
    category = "gemuk";
    label = "Gemuk (Overweight)";
    color = "oklch(0.68 0.18 45)"; // Rich Peach / Orange
    bg = "var(--clay-peach)";
    description = "Berat badan Anda sedikit melebihi ideal. Perhatikan porsi makan dan tingkatkan aktivitas fisik.";
  } else if (bmi >= 30) {
    category = "obesitas";
    label = "Obesitas (Obese)";
    color = "oklch(0.58 0.19 15)"; // Red-Pink
    bg = "var(--clay-pink)";
    description = "Berat badan Anda masuk kategori obesitas. Sangat disarankan untuk mengatur asupan kalori dan konsultasi gizi.";
  }

  return { bmi, category, label, color, description, bg };
}

