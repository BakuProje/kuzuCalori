export interface FoodEntry {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  calories: number;
  portion: string;
  imageUrl?: string;
  items?: { name: string; calories: number }[];
  createdAt: number;
}

const KEY = "kalori_log";

export function getAllEntries(): FoodEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function getEntriesByDate(date: string): FoodEntry[] {
  return getAllEntries().filter((e) => e.date === date);
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function addEntry(entry: Omit<FoodEntry, "id" | "createdAt">): FoodEntry {
  const all = getAllEntries();
  const item: FoodEntry = {
    ...entry,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  all.unshift(item);
  localStorage.setItem(KEY, JSON.stringify(all));
  return item;
}

export function updateEntry(id: string, patch: Partial<FoodEntry>) {
  const all = getAllEntries().map((e) => (e.id === id ? { ...e, ...patch } : e));
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function deleteEntry(id: string) {
  const all = getAllEntries().filter((e) => e.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function groupByDate(entries: FoodEntry[]) {
  const map = new Map<string, FoodEntry[]>();
  for (const e of entries) {
    if (!map.has(e.date)) map.set(e.date, []);
    map.get(e.date)!.push(e);
  }
  return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
}

export function getReportStats(days: number) {
  const all = getAllEntries();
  const dailyBreakdown: { date: string; total: number }[] = [];

  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dayTotal = all
      .filter((e) => e.date === key)
      .reduce((s, e) => s + e.calories, 0);

    dailyBreakdown.push({ date: key, total: dayTotal });
  }

  const total = dailyBreakdown.reduce((s, e) => s + e.total, 0);

  return {
    total,
    avg: Math.round(total / days),
    daysTracked: dailyBreakdown.filter((d) => d.total > 0).length,
    range: days,
    chartData: dailyBreakdown.reverse(),
  };
}
