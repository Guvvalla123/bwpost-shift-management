import { Link } from "react-router-dom";
import { LogIn, CalendarDays, Clock, FileText } from "lucide-react";

function scrollToSection(e, id) {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

const features = [
  {
    icon: CalendarDays,
    title: "Shift Scheduling",
    desc: "Create and manage shifts with capacity control and real-time slot tracking.",
  },
  {
    icon: Clock,
    title: "Attendance Tracking",
    desc: "Check-in, check-out and break management tied directly to each shift.",
  },
  {
    icon: FileText,
    title: "Request Management",
    desc: "Leave and shift-change requests with full manager approval workflow.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-[#0f2042] antialiased">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm shadow-slate-900/5">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-baseline gap-0.5 shrink-0">
            <span className="font-extrabold text-[#1B3F8B] text-xl">BW</span>
            <span className="font-light text-slate-400 text-xl">POST</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#home"
              onClick={(e) => scrollToSection(e, "home")}
              className="text-slate-700 text-sm font-medium hover:text-[#1B3F8B] transition-colors cursor-pointer"
            >
              Home
            </a>
            <a
              href="#about"
              onClick={(e) => scrollToSection(e, "about")}
              className="text-slate-700 text-sm font-medium hover:text-[#1B3F8B] transition-colors cursor-pointer"
            >
              About
            </a>
            <a
              href="#services"
              onClick={(e) => scrollToSection(e, "services")}
              className="text-slate-700 text-sm font-medium hover:text-[#1B3F8B] transition-colors cursor-pointer"
            >
              Services
            </a>
            <a
              href="#contact"
              onClick={(e) => scrollToSection(e, "contact")}
              className="text-slate-700 text-sm font-medium hover:text-[#1B3F8B] transition-colors cursor-pointer"
            >
              Contact
            </a>
          </nav>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-[#1B3F8B] text-white font-bold px-6 py-2.5 rounded-lg text-sm hover:bg-[#162d5e] transition shrink-0"
          >
            Login
            <LogIn className="w-4 h-4" aria-hidden />
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col pt-16">
        <section
          id="home"
          className="relative w-full min-h-screen bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url(/images/bwpost_hero.jpg)" }}
        >
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#0f2042]/92 via-[#1B3F8B]/75 to-[#0f2042]/30 pointer-events-none"
            aria-hidden
          />
          <div className="relative z-10 max-w-7xl mx-auto px-8 flex flex-col justify-center min-h-screen pb-16">
            <div className="max-w-xl">
              <h1 className="text-white text-5xl sm:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6">
                <span className="block">Shift Management System</span>

              </h1>
              <p className="text-white/60 text-base leading-relaxed mb-10 max-w-md">
                Schedule shifts, track attendance and manage requests for 2,200+ delivery staff — all in one place.
              </p>
            </div>
          </div>
        </section>

        <section id="about" className="bg-[#162d5e] border-t-2 border-[#2563EB] py-6 px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { v: "2,200+", l: "Delivery staff" },
              { v: "3", l: "Daily shift types" },
              { v: "160+", l: "Admin & office team" },
              { v: "100%", l: "Internal use only" },
            ].map((s) => (
              <div key={s.l}>
                <p className="text-white text-2xl font-extrabold tabular-nums">{s.v}</p>
                <p className="text-white/40 text-xs uppercase tracking-wider mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="services" className="py-20 px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-[#1B3F8B] text-xs font-bold tracking-widest uppercase mb-3">What we offer</p>
              <h2 className="text-[#0f2042] text-4xl font-extrabold">Everything your team needs</h2>
              <p className="text-slate-400 text-base mt-3 max-w-xl mx-auto">
                Built for BWPost&apos;s internal HR and operations teams.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="p-8 rounded-2xl border border-slate-200 hover:border-[#1B3F8B]/30 hover:shadow-lg hover:shadow-slate-100 transition-all duration-200"
                >
                  <div className="w-12 h-12 bg-[#EFF6FF] rounded-xl flex items-center justify-center mb-5">
                    <f.icon className="w-[22px] h-[22px] text-[#1B3F8B]" aria-hidden />
                  </div>
                  <h3 className="font-bold text-[#0f2042] text-lg mb-2">{f.title}</h3>
                  <p className="text-slate-500 leading-relaxed text-sm">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer id="contact" className="bg-[#0f2042] text-white py-12 px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 mb-8">
            <div>
              <p className="text-xl tracking-tight">
                <span className="font-extrabold text-white/90">BW</span>
                <span className="font-light text-[#93C5FD]">POST</span>
              </p>
              <p className="text-white/40 text-sm mt-2">Internal Shift Management System</p>
              <p className="text-white/30 text-xs mt-1">Stuttgart, Baden-Württemberg, Germany</p>
            </div>
            <div>
              <p className="font-bold text-xs uppercase tracking-wider text-white/40 mb-4">Navigation</p>
              <ul className="space-y-2">
                {[
                  ["Home", "home"],
                  ["About", "about"],
                  ["Services", "services"],
                  ["Contact", "contact"],
                ].map(([label, id]) => (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      onClick={(e) => scrollToSection(e, id)}
                      className="text-white/60 text-sm hover:text-white transition cursor-pointer"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-bold text-xs uppercase tracking-wider text-white/40 mb-4">Contact</p>
              <p className="text-white/60 text-sm">info@bwpost.de</p>
              <p className="text-white/40 text-xs mt-1">Mo.–Fr.: 08:00–17:00 Uhr</p>
              <p className="text-white/60 text-sm mt-2">0711 2526 7800</p>
            </div>
          </div>
          <div className="max-w-7xl mx-auto border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-white/30 text-xs">
            <span>© {new Date().getFullYear()} BWPost — Internal shift management.</span>
            <span>Not for public use.</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
