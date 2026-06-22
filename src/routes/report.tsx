import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { ClayBackdrop } from "@/components/ClayBackdrop";
import { NavBar } from "@/components/NavBar";
import { calcRecommended, getProfile, type Profile } from "@/lib/profile";
import { getReportStats, getAllEntries, type FoodEntry } from "@/lib/foods";
import { 
  BarChart3, 
  Download, 
  Calendar, 
  TrendingUp, 
  Zap, 
  Target, 
  ChevronDown, 
  Info,
  Sparkles,
  Utensils
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { format, subDays, startOfDay } from 'date-fns';
import { id } from 'date-fns/locale';

export const Route = createFileRoute("/report")({
  component: ReportPage,
});

function CountUp({ end, duration = 1000 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);
  return <span>{count.toLocaleString('id-ID')}</span>;
}

function ReportPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [range, setRange] = useState<7 | 30>(7);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setProfile(getProfile());
  }, []);

  if (!profile) return null;

  const target = calcRecommended(profile);
  const stats = getReportStats(range);
  const allEntries = getAllEntries();
  const fmt = (n: number) => n.toLocaleString("id-ID");

  // Filter entries for the detail list
  const threshold = startOfDay(subDays(new Date(), range - 1));
  const filteredEntries = allEntries.filter(e => new Date(e.date + "T00:00:00") >= threshold)
    .sort((a, b) => b.createdAt - a.createdAt);

  const handleExport = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#f8fafc"
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Laporan-Nutrisi-Kcal-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50/50 relative overflow-x-hidden">
      <ClayBackdrop />

      <main className="mx-auto mt-8 flex-1 w-full max-w-5xl px-4">
        {/* TOP ACTIONS */}
        <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-primary">Statistik Nutrisi</h1>
            <p className="text-sm font-medium text-muted-foreground opacity-60">Dashboard analisis kesehatan premium kamu.</p>
          </div>
          
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="clay-btn group flex items-center gap-2 !px-6 !py-3.5 text-sm shadow-xl transition-all hover:scale-105 active:scale-95 text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, var(--clay-pink), var(--clay-peach))" }}
          >
            <Download className={`h-5 w-5 ${isExporting ? 'animate-bounce' : ''}`} />
            <span className="font-extrabold uppercase tracking-widest">
              {isExporting ? "Memproses..." : "Export PDF"}
            </span>
          </button>
        </div>

        {/* REPORT CONTENT FOR CAPTURE */}
        <div ref={reportRef} className="space-y-8 p-1 sm:p-2">
          
          {/* HEADER & FILTER */}
          <div className="clay p-8 md:p-10 relative overflow-hidden">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50 mb-1">Periode Laporan</div>
                <div className="text-lg sm:text-2xl font-black whitespace-nowrap">
                  {format(threshold, 'd MMM', { locale: id })} - {format(new Date(), 'd MMM yyyy', { locale: id })}
                </div>
              </div>

              <div className="flex p-1.5 bg-black/5 rounded-3xl backdrop-blur-md">
                {[7, 30].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r as 7 | 30)}
                    className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                      range === r ? 'clay shadow-lg bg-white text-primary' : 'text-muted-foreground hover:text-primary'
                    }`}
                  >
                    {r} Hari
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <SummaryCard 
              label="Total Kalori" 
              value={stats.total} 
              unit="kcal" 
              icon={TrendingUp} 
              bg="var(--clay-mint)" 
            />
            <SummaryCard 
              label="Rata-rata" 
              value={stats.avg} 
              unit="kcal" 
              icon={Zap} 
              bg="var(--clay-lavender)" 
            />
            <SummaryCard 
              label="Hari Aktif" 
              value={stats.daysTracked} 
              unit="hari" 
              icon={Calendar} 
              bg="var(--clay-peach)" 
            />
            <SummaryCard 
              label="Vs Target" 
              value={Math.round((stats.avg / target) * 100)} 
              unit="%" 
              icon={Target} 
              bg={stats.avg > target ? "var(--clay-pink)" : "var(--clay-mint)"} 
            />
          </div>

          {/* MAIN CHART */}
          <div className="clay p-8 md:p-10">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">Grafik Tren Nutrisi</h2>
                <p className="text-xs font-bold opacity-40 uppercase tracking-widest mt-1">Daily calorie intake distribution</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider opacity-60">
                  <div className="h-2.5 w-2.5 rounded-full bg-primary" /> Asupan
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider opacity-60">
                  <div className="h-2.5 w-2.5 rounded-full bg-black/10 border border-dashed border-black/20" /> Target
                </div>
              </div>
            </div>

            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 800, fill: 'rgba(0,0,0,0.3)' }}
                    tickFormatter={(val) => format(new Date(val + "T00:00:00"), 'd MMM', { locale: id })}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 800, fill: 'rgba(0,0,0,0.3)' }}
                  />
                  <Tooltip content={<CustomTooltip target={target} />} />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="var(--color-primary)" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorCal)" 
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>


          {/* DETAIL LIST */}
          <div className="clay p-8 md:p-10">
            <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
              <Utensils className="h-6 w-6 text-primary" />
              Rincian Makanan
            </h2>
            
            {filteredEntries.length === 0 ? (
              <div className="clay-inset p-12 text-center opacity-40 italic font-bold">
                Belum ada catatan makanan dalam periode ini.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEntries.map((entry) => (
                  <DetailItem key={entry.id} entry={entry} />
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
      <NavBar />
    </div>
  );
}

function SummaryCard({ label, value, unit, icon: Icon, bg }: { 
  label: string; 
  value: number; 
  unit: string; 
  icon: any; 
  bg: string;
}) {
  return (
    <div className="clay p-6 group hover:scale-[1.03] transition-all duration-500 cursor-default" style={{ background: bg }}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-2.5 rounded-2xl bg-white/30 backdrop-blur-md shadow-inner group-hover:rotate-12 transition-transform">
          <Icon className="h-5 w-5 opacity-70" />
        </div>
        <div className="h-1.5 w-8 rounded-full bg-black/10" />
      </div>
      <div className="flex items-baseline gap-1">
        <div className="text-2xl sm:text-3xl font-black"><CountUp end={value} /></div>
        <div className="text-xs font-bold opacity-60 lowercase">{unit}</div>
      </div>
      <div className="text-[10px] font-black uppercase tracking-widest opacity-50 mt-1.5">{label}</div>
    </div>
  );
}

function DetailItem({ entry }: { entry: FoodEntry }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="clay-soft overflow-hidden group">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-black/5"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="clay-inset h-12 w-12 shrink-0 bg-white/50 overflow-hidden">
            {entry.imageUrl ? (
              <img src={entry.imageUrl} alt={entry.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xl">🍽️</div>
            )}
          </div>
          <div className="min-w-0">
            <div className="font-black truncate">{entry.name}</div>
            <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
              {format(new Date(entry.date + "T00:00:00"), 'd MMM yyyy', { locale: id })}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <div className="text-lg font-black">{entry.calories.toLocaleString('id-ID')} <span className="text-[10px] opacity-40">kcal</span></div>
            <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{entry.portion}</div>
          </div>
          <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
            <ChevronDown className="h-5 w-5 opacity-30" />
          </div>
        </div>
      </button>
      
      {isOpen && entry.items && (
        <div className="px-5 pb-5 animate-in slide-in-from-top-2 duration-300">
          <div className="clay-inset p-4 bg-white/30 space-y-2">
            <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 mb-3 border-b border-black/5 pb-2">Komposisi Makanan</div>
            {entry.items.map((it, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <span className="font-bold opacity-70">{it.name}</span>
                <span className="font-black text-primary">{it.calories} <span className="text-[10px] opacity-50">kcal</span></span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CustomTooltip({ active, payload, target }: any) {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    const over = val > target;
    return (
      <div className="clay p-4 bg-white shadow-2xl border-none">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">
          {format(new Date(payload[0].payload.date + "T00:00:00"), 'EEEE, d MMM', { locale: id })}
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-primary">{val.toLocaleString('id-ID')}</span>
          <span className="text-xs font-bold opacity-50">kcal</span>
        </div>
        <div className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
          over ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
        }`}>
          {over ? 'Melebihi Target' : 'Di Bawah Target'}
        </div>
      </div>
    );
  }
  return null;
}
