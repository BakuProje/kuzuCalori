import { Link, useLocation } from "@tanstack/react-router";
import { BarChart3, Camera, Code2, History, User } from "lucide-react";
import { getProfile } from "@/lib/profile";
import { useEffect, useState } from "react";

export function NavBar() {
  const { pathname } = useLocation();
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    setHasProfile(!!getProfile());
  }, [pathname]);

  const navItem = (to: string, label: string, Icon: any) => {
    const active = pathname === to;
    return (
      <Link
        to={to}
        className="flex flex-col items-center justify-center h-full relative z-10 transition-all active:scale-95 group w-full"
      >
        <Icon
          className={`h-5 w-5 mb-1 transition-all duration-300 ${active
              ? "text-primary scale-110 nav-active-bounce"
              : "text-slate-400 opacity-70 group-hover:text-primary group-hover:opacity-100"
            }`}
        />
        <span
          className={`text-[9px] font-black uppercase tracking-[0.1em] leading-none transition-all duration-300 ${active
              ? "text-primary opacity-100"
              : "text-slate-400 opacity-40 group-hover:opacity-100"
            }`}
        >
          {label}
        </span>
      </Link>
    );
  };

  return (
    <>
      {/* ✅ FLOW NAVBAR — Standard block flow at the bottom of pages */}
      <div className="w-[94%] max-w-[500px] mx-auto my-6 z-[100] pointer-events-none">
        <nav className={`pointer-events-auto relative grid h-[65px] w-full items-center rounded-full border border-white/50 bg-white/80 px-2 shadow-[0_15px_35px_rgba(0,0,0,0.12)] ring-1 ring-black/5 backdrop-blur-2xl ${
          hasProfile ? "grid-cols-5" : "grid-cols-3"
        }`}>
          {navItem("/", "Profil", User)}
          {hasProfile && navItem("/history", "Histori", History)}
          
          {/* FAB */}
          <div className="relative flex h-full flex-col items-center justify-end pb-1.5">
            <Link
              to="/app"
              className={`absolute -top-7 z-[110] flex h-[58px] w-[58px] items-center justify-center rounded-full border-[3px] border-white transition-all active:scale-[0.92] group shadow-[0_8px_20px_rgba(37,99,235,0.35)] ${pathname === "/app" ? "ring-2 ring-primary/40" : ""
                }`}
              style={{
                background:
                  "linear-gradient(160deg, #60a5fa 0%, #2563eb 45%, #1d4ed8 100%)",
              }}
            >
              <Camera className="h-7 w-7 text-white" />
            </Link>
            <span
              className={`pt-1 text-[9px] font-black ${pathname === "/app"
                  ? "text-primary"
                  : "text-slate-400 opacity-50"
                }`}
            >
              Foto
            </span>
          </div>

          {hasProfile && navItem("/report", "Stats", BarChart3)}
          {navItem("/dev", "Dev", Code2)}
        </nav>
      </div>
    </>
  );
}