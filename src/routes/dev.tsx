import { createFileRoute } from "@tanstack/react-router";
import { ClayBackdrop } from "@/components/ClayBackdrop";
import { NavBar } from "@/components/NavBar";
import {
  Code2,
  Globe,
} from "lucide-react";

export const Route = createFileRoute("/dev")({
  component: DevPage,
  head: () => ({
    meta: [
      { title: "Developer — Kcal" },
      { name: "description", content: "Tentang pengembang aplikasi Calori AI." },
    ],
  }),
});

const SKILLS = [
  "React",
  "TypeScript",
  "Node.js",
  "TanStack",
  "AI Vision",
  "Tailwind",
] as const;



function DevPage() {
  const year = new Date().getFullYear();

  const socialLinks = [
    {
      name: "Instagram",
      icon: "/images/ig-icon.svg",
      url: "https://www.instagram.com/kuzuroken.20",
      color: "from-blue-600 to-blue-700",
      label: "Kuzuroken",
    },
    {
      name: "TikTok",
      icon: "/images/tiktok.svg",
      url: "https://www.tiktok.com/@kuzuroken",
      color: "from-blue-600 to-blue-700",
      label: "Kuzuroken",
    },
    {
      name: "Website",
      icon: Globe,
      url: "https://kuzuroken.site",
      color: "from-blue-600 to-blue-700",
      label: "Kuzuroken",
    },
  ];

  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden bg-slate-50/50 relative">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-[-8%] top-[-12%] h-[min(28rem,90vw)] w-[min(28rem,90vw)] animate-pulse rounded-full bg-blue-400/12 blur-[100px] sm:h-[32rem] sm:w-[32rem]" />
        <div
          className="absolute bottom-[-12%] right-[-8%] h-[min(26rem,88vw)] w-[min(26rem,88vw)] animate-pulse rounded-full bg-cyan-400/10 blur-[90px] sm:h-[30rem] sm:w-[30rem]"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <ClayBackdrop />

      <main className="relative z-10 mx-auto flex-1 w-full max-w-md px-3 pt-2 sm:max-w-lg sm:px-4 sm:pt-4 md:max-w-xl md:pt-5">
        <div
          className="animate-in fade-in slide-in-from-bottom-4 relative mb-10 duration-[400ms] ease-out"
          style={{ animationDuration: "400ms", animationTimingFunction: "cubic-bezier(0, 0, 0.2, 1)" }}
        >
          <div className="relative flex flex-col items-center px-5 py-6 text-center sm:px-6 sm:py-6 md:px-6 md:py-6">


            {/* Avatar: 80–100px, glow, float -10px, scale-in */}
            <div
              className="animate-in zoom-in-95 fade-in mb-5 flex justify-center duration-500 ease-out sm:mb-6"
              style={{ animationDuration: "480ms", animationDelay: "40ms" }}
            >
              <div className="-translate-y-[10px]">
                <div className="relative">
                  <div
                    className="absolute -inset-1 rounded-full bg-gradient-to-br from-sky-400 via-primary to-blue-700 opacity-90 blur-md"
                    aria-hidden
                  />
                  <div className="relative rounded-full p-[3px] shadow-[0_12px_28px_rgba(37,99,235,0.35)] ring-[3px] ring-white">
                    <img
                      src="/images/kuzulogobg.png"
                      alt="Kuzuroken"
                      className="h-20 w-20 rounded-full border-[3px] border-white bg-white object-cover sm:h-[92px] sm:w-[92px] md:h-[100px] md:w-[100px]"
                      onError={(e) => {
                        e.currentTarget.src = "https://github.com/kuzuroken.png";
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <h1
              className="animate-in fade-in slide-in-from-bottom-2 text-center text-[22px] font-black leading-tight tracking-tight text-slate-900 delay-100 duration-[400ms] ease-out sm:text-2xl md:text-[24px]"
              style={{ animationDuration: "400ms" }}
            >
              Kuzuroken
            </h1>
            <div
              className="animate-in fade-in slide-in-from-bottom-2 mt-2 flex flex-wrap items-center justify-center gap-2 text-primary delay-150 duration-[400ms] ease-out"
              style={{ animationDuration: "400ms" }}
            >
              <Code2 className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2.25} aria-hidden />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary sm:text-xs">
                Lead developer
              </span>
            </div>

            <p
              className="animate-in fade-in slide-in-from-bottom-2 mx-auto mt-4 max-w-[280px] text-sm font-medium leading-relaxed text-slate-500 delay-200 duration-[400ms] ease-out sm:mt-5 sm:max-w-sm sm:text-[15px] md:max-w-md"
              style={{ animationDuration: "400ms" }}
            >
              Membangun solusi cerdas untuk hidup yang lebih sehat melalui teknologi AI.
            </p>



            {/* Skills */}
            <div
              className="animate-in fade-in slide-in-from-bottom-2 mt-6 w-full max-w-md text-left delay-300 duration-[400ms] ease-out sm:mt-8"
              style={{ animationDuration: "400ms" }}
            >
              <p className="mb-3 text-center text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
                Tech stack
              </p>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5">
                {SKILLS.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-primary/10 bg-primary/[0.08] px-3 py-1.5 text-[11px] font-bold text-primary shadow-sm sm:px-3.5 sm:text-xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Social — [icon] [platform + user] [→] */}
            <div className="mt-6 w-full space-y-3 sm:mt-8">
              {socialLinks.map((social, idx) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="animate-in fade-in slide-in-from-bottom-2 group flex min-h-[52px] items-center justify-between gap-3 rounded-[18px] border border-white/90 bg-white/85 px-3.5 py-3 shadow-[0_4px_14px_rgba(15,23,42,0.06)] backdrop-blur-md duration-[400ms] ease-out transition-[transform,box-shadow] active:scale-[0.98] sm:min-h-[56px] sm:px-4 sm:py-3.5 md:hover:-translate-y-0.5 md:hover:shadow-lg"
                  style={{
                    animationDuration: "400ms",
                    animationDelay: `${360 + idx * 90}ms`,
                  }}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-3.5">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${social.color} text-white shadow-md sm:h-12 sm:w-12`}
                    >
                      {typeof social.icon === "string" ? (
                        <img
                          src={social.icon}
                          className="h-5.5 w-5.5 object-contain brightness-0 invert"
                          alt=""
                        />
                      ) : (
                        <social.icon className="h-5.5 w-5.5" strokeWidth={2.5} />
                      )}
                    </div>
                    <div className="min-w-0 text-left">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {social.name}
                      </div>
                      <div className="truncate font-bold text-slate-900 sm:text-[15px]">{social.label}</div>
                    </div>
                  </div>

                </a>
              ))}
            </div>


          </div>
        </div>
      </main>
      <NavBar />
    </div>
  );
}
