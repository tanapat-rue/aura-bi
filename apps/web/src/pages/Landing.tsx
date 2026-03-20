import { Link } from "react-router-dom";

export function Landing() {
  return (
    <div className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-30%] left-[15%] w-[700px] h-[700px] bg-aura-600/[0.06] rounded-full blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[5%] w-[600px] h-[600px] bg-accent-purple/[0.04] rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[60%] w-[400px] h-[400px] bg-accent-teal/[0.03] rounded-full blur-[100px]" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />
      </div>

      {/* ─── Hero ─────────────────────────────────────────── */}
      <div className="relative max-w-5xl mx-auto px-5 pt-28 pb-24">
        <div className="text-center space-y-7 animate-fade-in">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-semibold tracking-wide" style={{
            background: "linear-gradient(135deg, rgba(74,222,128,0.08) 0%, rgba(74,222,128,0.02) 100%)",
            border: "1px solid rgba(74,222,128,0.15)",
            color: "#4ade80",
          }}>
            <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
            YOUR DATA NEVER LEAVES YOUR MACHINE
          </div>

          <h1 className="text-[3.5rem] md:text-[4.2rem] font-extrabold tracking-tight leading-[1.05]">
            See your data.
            <br />
            <span className="text-transparent bg-clip-text" style={{
              backgroundImage: "linear-gradient(135deg, #8ea4ff 0%, #5468f6 30%, #a78bfa 60%, #f472b6 100%)",
            }}>
              Own every insight.
            </span>
          </h1>

          <p className="text-[1.1rem] text-gray-400 max-w-[38rem] mx-auto leading-relaxed">
            AuraBI is the business intelligence platform where your data stays yours.
            Clean, transform, and visualize — entirely inside your browser.
            No uploads. No servers watching. Just you and your data.
          </p>

          <div className="flex gap-4 justify-center pt-3">
            <Link to="/dashboard" className="btn-primary text-[15px] px-8 py-3.5">
              Open AuraBI
            </Link>
            <a href="#how-it-works" className="btn-secondary text-[15px] px-8 py-3.5">
              See how it works
            </a>
          </div>

          <div className="flex items-center justify-center gap-6 pt-2 text-[13px] text-gray-500">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Free to use
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              No sign-up required
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Works offline
            </span>
          </div>
        </div>

        {/* ─── App Preview ────────────────────────────────── */}
        <div className="mt-20 relative animate-slide-up">
          <div className="absolute -inset-4 bg-gradient-to-t from-[#08080d] via-transparent to-transparent z-10 pointer-events-none" />
          <div className="absolute -inset-1 rounded-2xl opacity-30 blur-xl" style={{ background: "linear-gradient(135deg, #5468f6 0%, #a78bfa 50%, #f472b6 100%)" }} />
          <div className="relative rounded-2xl overflow-hidden" style={{
            border: "1px solid rgba(255,255,255,0.08)",
            background: "linear-gradient(135deg, #0e0e16 0%, #0a0a12 100%)",
            boxShadow: "0 25px 80px rgba(0,0,0,0.6)",
          }}>
            {/* Mock toolbar */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.04]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-accent-red/40" />
                <div className="w-3 h-3 rounded-full bg-accent-amber/40" />
                <div className="w-3 h-3 rounded-full bg-accent-green/40" />
              </div>
              <div className="flex-1 text-center text-xs text-gray-600">Q4 Revenue Analysis — AuraBI</div>
            </div>
            {/* Mock dashboard */}
            <div className="grid grid-cols-4 gap-3 p-4">
              {[
                { label: "Total Revenue", value: "$2.4M", delta: "+12.3%", up: true },
                { label: "Active Customers", value: "18,429", delta: "+8.1%", up: true },
                { label: "Avg Deal Size", value: "$3,241", delta: "+15.7%", up: true },
                { label: "Churn Rate", value: "2.1%", delta: "-0.4%", up: false },
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{kpi.label}</div>
                  <div className="text-xl font-bold text-white mt-1">{kpi.value}</div>
                  <div className={`text-xs mt-1 font-medium ${kpi.up ? "text-accent-green" : "text-accent-teal"}`}>{kpi.delta}</div>
                </div>
              ))}
              {/* Mock chart */}
              <div className="col-span-3 rounded-xl p-4 h-44" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-4">Revenue by Month</div>
                <div className="flex items-end gap-[6px] h-28">
                  {[35, 42, 38, 55, 48, 62, 58, 72, 65, 80, 75, 88].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-[3px] transition-all" style={{
                      height: `${h}%`,
                      background: `linear-gradient(to top, rgba(84,104,246,0.7), rgba(84,104,246,0.3))`,
                      boxShadow: "0 -2px 8px rgba(84,104,246,0.15)",
                    }} />
                  ))}
                </div>
              </div>
              {/* Mock donut */}
              <div className="rounded-xl p-4 h-44 flex flex-col items-center justify-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-3 self-start">By Region</div>
                <div className="w-24 h-24 rounded-full" style={{
                  background: "conic-gradient(#5468f6 0% 35%, #a78bfa 35% 55%, #2dd4bf 55% 75%, #fbbf24 75% 100%)",
                  mask: "radial-gradient(circle at center, transparent 55%, black 56%)",
                  WebkitMask: "radial-gradient(circle at center, transparent 55%, black 56%)",
                }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── How It Works ─────────────────────────────────── */}
      <div id="how-it-works" className="relative max-w-5xl mx-auto px-5 pb-24">
        <div className="text-center mb-14">
          <div className="text-[11px] font-semibold text-aura-400 uppercase tracking-widest mb-3">How it works</div>
          <h2 className="text-3xl font-bold">From raw file to insight in minutes</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "Drop your data",
              desc: "Drag CSV, JSON, or Parquet files into the browser. Your data loads instantly into a high-performance engine — nothing is uploaded anywhere.",
              accent: "#4ade80",
            },
            {
              step: "02",
              title: "Clean & transform",
              desc: "Profile every column for quality. Build visual ETL pipelines — filter, join, aggregate, handle nulls, flatten JSON — all with a few clicks.",
              accent: "#5468f6",
            },
            {
              step: "03",
              title: "Build dashboards",
              desc: "Add scorecards, charts, tables, and filters to a live canvas. Every widget is configurable. Click any chart to cross-filter the rest.",
              accent: "#a78bfa",
            },
          ].map((s) => (
            <div key={s.step} className="relative rounded-2xl p-6 transition-all duration-300 group" style={{
              background: "linear-gradient(135deg, rgba(20,20,28,0.8) 0%, rgba(14,14,20,0.9) 100%)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}>
              <div className="text-[40px] font-extrabold leading-none mb-4" style={{ color: s.accent + "18" }}>{s.step}</div>
              <h3 className="text-lg font-bold text-gray-100 mb-2">{s.title}</h3>
              <p className="text-[13px] text-gray-400 leading-relaxed">{s.desc}</p>
              <div className="absolute top-6 right-6 w-8 h-8 rounded-full opacity-20 group-hover:opacity-40 transition-opacity" style={{ background: s.accent, filter: "blur(10px)" }} />
            </div>
          ))}
        </div>
      </div>

      {/* ─── What Sets Us Apart ───────────────────────────── */}
      <div className="relative max-w-5xl mx-auto px-5 pb-24">
        <div className="text-center mb-14">
          <div className="text-[11px] font-semibold text-accent-teal uppercase tracking-widest mb-3">Why AuraBI</div>
          <h2 className="text-3xl font-bold">Built different, on purpose</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {[
            {
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />,
              title: "Privacy is the architecture, not a feature",
              desc: "Every calculation runs inside your browser. There is no backend processing your data. No telemetry. No \"anonymous analytics.\" The most secure data warehouse is the one that doesn't exist.",
              accent: "#4ade80",
            },
            {
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />,
              title: "ETL that doesn't need a data team",
              desc: "Visual pipeline builder with 14 transform types. Filter rows, fill nulls, join tables, flatten nested JSON, calculate fields — see results before you commit. Data cleaning shouldn't require a PhD.",
              accent: "#5468f6",
            },
            {
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
              title: "Dashboards that understand your question",
              desc: "17 visualization types from scorecards to treemaps. Every widget gets its own dimensions, metrics, filters, and formatting. Cross-filtering connects them into a living analytical surface.",
              accent: "#a78bfa",
            },
            {
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
              title: "SQL when you need it, UI when you don't",
              desc: "Full SQL engine with CTEs, window functions, JSON operators, and regex. Save multiple query tabs. Or never write a line of SQL — the visual tools generate it for you.",
              accent: "#22d3ee",
            },
            {
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
              title: "Projects you can save and share",
              desc: "Save your entire workspace — data sources, pipelines, dashboards, SQL — as a project. Export as a file and share with your team. They bring their own data, see your analysis.",
              accent: "#fbbf24",
            },
            {
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
              title: "Works everywhere, depends on nothing",
              desc: "No installation. No database credentials. No IT ticket. Open a browser, drop a file, start analyzing. Works on a plane. Works on a Chromebook. Works when the VPN is down.",
              accent: "#f472b6",
            },
          ].map((f) => (
            <div key={f.title} className="flex gap-4 rounded-2xl p-5 transition-all duration-300 group" style={{
              background: "linear-gradient(135deg, rgba(20,20,28,0.6) 0%, rgba(14,14,20,0.8) 100%)",
              border: "1px solid rgba(255,255,255,0.04)",
            }}>
              <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{
                background: `${f.accent}10`,
                border: `1px solid ${f.accent}18`,
              }}>
                <svg className="w-5 h-5" style={{ color: f.accent }} fill="none" viewBox="0 0 24 24" stroke="currentColor">{f.icon}</svg>
              </div>
              <div>
                <h3 className="font-bold text-[15px] text-gray-100 mb-1.5">{f.title}</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Who It's For ─────────────────────────────────── */}
      <div className="relative max-w-5xl mx-auto px-5 pb-24">
        <div className="text-center mb-14">
          <div className="text-[11px] font-semibold text-accent-amber uppercase tracking-widest mb-3">Built for</div>
          <h2 className="text-3xl font-bold">People who work with data every day</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              role: "Analysts",
              desc: "Stop waiting for data engineering. Drop a CSV, build a dashboard, present in the same meeting.",
              gradient: "from-aura-500/10 to-transparent",
            },
            {
              role: "Founders & PMs",
              desc: "Understand your metrics without a BI license. Export insights matter, not subscription receipts.",
              gradient: "from-accent-teal/10 to-transparent",
            },
            {
              role: "Privacy-first teams",
              desc: "Healthcare, finance, legal — when the data can't leave the building, AuraBI doesn't ask it to.",
              gradient: "from-accent-green/10 to-transparent",
            },
          ].map((p) => (
            <div key={p.role} className={`rounded-2xl p-6 bg-gradient-to-br ${p.gradient}`} style={{ border: "1px solid rgba(255,255,255,0.04)" }}>
              <h3 className="text-lg font-bold text-gray-100 mb-2">{p.role}</h3>
              <p className="text-[13px] text-gray-400 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── CTA ──────────────────────────────────────────── */}
      <div className="relative max-w-5xl mx-auto px-5 pb-32">
        <div className="text-center rounded-3xl py-16 px-8 relative overflow-hidden" style={{
          background: "linear-gradient(135deg, rgba(84,104,246,0.08) 0%, rgba(167,139,250,0.04) 50%, rgba(244,114,182,0.04) 100%)",
          border: "1px solid rgba(84,104,246,0.12)",
        }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-[30%] w-[300px] h-[200px] bg-aura-500/[0.06] rounded-full blur-[80px]" />
          </div>
          <div className="relative">
            <h2 className="text-3xl font-bold mb-3">Your data deserves better</h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto">
              No account needed. No credit card. Just open AuraBI, drop your file, and see what your data has been trying to tell you.
            </p>
            <Link to="/dashboard" className="btn-primary text-[15px] px-10 py-4">
              Start now — it's free
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/[0.04] py-8 text-center text-xs text-gray-600">
        AuraBI — Zero-trust business intelligence. Your data, your machine, your insights.
      </div>
    </div>
  );
}
