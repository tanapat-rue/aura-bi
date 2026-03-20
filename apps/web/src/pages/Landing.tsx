import { Link } from "react-router-dom";

export function Landing() {
  return (
    <div className="relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-aura-600/[0.07] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-accent-purple/[0.05] rounded-full blur-[100px]" />
        <div className="absolute top-[30%] right-[30%] w-[300px] h-[300px] bg-accent-teal/[0.04] rounded-full blur-[80px]" />
      </div>

      {/* Hero */}
      <div className="relative max-w-5xl mx-auto px-5 pt-24 pb-20">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium text-gray-400">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
            100% Local-First Processing
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1]">
            Business Intelligence
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-aura-400 via-aura-500 to-accent-purple">
              that respects your data
            </span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            AuraBI processes everything locally using DuckDB-WASM.
            Upload, clean, transform, and visualize - without sending a single byte to any server.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Link to="/dashboard" className="btn-primary text-sm px-7 py-3">
              Start Analyzing
            </Link>
            <Link to="/register" className="btn-secondary text-sm px-7 py-3">
              Create Account
            </Link>
          </div>
        </div>

        {/* Dashboard preview mockup */}
        <div className="mt-20 relative animate-slide-up">
          <div className="absolute inset-0 bg-gradient-to-t from-surface-0 via-transparent to-transparent z-10 pointer-events-none" />
          <div className="rounded-2xl border border-white/[0.06] bg-surface-1/80 backdrop-blur-sm overflow-hidden shadow-2xl">
            {/* Mock toolbar */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-accent-red/40" />
                <div className="w-3 h-3 rounded-full bg-accent-amber/40" />
                <div className="w-3 h-3 rounded-full bg-accent-green/40" />
              </div>
              <div className="text-xs text-gray-600 flex-1 text-center">Sales Dashboard - AuraBI</div>
            </div>
            {/* Mock widgets */}
            <div className="grid grid-cols-4 gap-3 p-4">
              {/* KPI cards */}
              {[
                { label: "Revenue", value: "$2.4M", change: "+12.3%", color: "from-aura-500/20 to-aura-600/5" },
                { label: "Orders", value: "18,429", change: "+8.1%", color: "from-accent-teal/20 to-accent-teal/5" },
                { label: "Customers", value: "3,241", change: "+15.7%", color: "from-accent-purple/20 to-accent-purple/5" },
                { label: "Avg Order", value: "$132", change: "-2.4%", color: "from-accent-amber/20 to-accent-amber/5" },
              ].map((kpi) => (
                <div key={kpi.label} className={`rounded-xl bg-gradient-to-br ${kpi.color} border border-white/[0.04] p-4`}>
                  <div className="text-xs text-gray-500 font-medium">{kpi.label}</div>
                  <div className="text-xl font-bold text-white mt-1">{kpi.value}</div>
                  <div className={`text-xs mt-1 ${kpi.change.startsWith("+") ? "text-accent-green" : "text-accent-red"}`}>
                    {kpi.change}
                  </div>
                </div>
              ))}
              {/* Mock chart */}
              <div className="col-span-2 rounded-xl bg-surface-2/60 border border-white/[0.04] p-4 h-40">
                <div className="text-xs text-gray-500 mb-3">Revenue Trend</div>
                <div className="flex items-end gap-1 h-24">
                  {[40, 55, 35, 70, 50, 85, 65, 90, 75, 95, 80, 88].map((h, i) => (
                    <div key={i} className="flex-1 bg-gradient-to-t from-aura-600/60 to-aura-400/30 rounded-t transition-all"
                      style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
              {/* Mock pie */}
              <div className="col-span-2 rounded-xl bg-surface-2/60 border border-white/[0.04] p-4 h-40">
                <div className="text-xs text-gray-500 mb-3">Sales by Category</div>
                <div className="flex items-center justify-center h-24">
                  <div className="w-24 h-24 rounded-full border-[8px] border-aura-500/50 border-t-accent-teal/50 border-r-accent-purple/50 border-b-accent-amber/50" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="relative max-w-5xl mx-auto px-5 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold">Why AuraBI?</h2>
          <p className="text-gray-500 text-sm mt-2">Compared to Power BI, Looker Studio, and Tableau</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              title: "Zero Data Leakage",
              desc: "Unlike Power BI & Looker that upload to cloud, AuraBI processes 100% in your browser. Your data never leaves your machine.",
              gradient: "from-accent-green/10 to-transparent",
              border: "hover:border-accent-green/20",
            },
            {
              title: "Full ETL Pipeline",
              desc: "Clean, filter, join, aggregate, calculate fields - visual pipeline builder with 12 transform types. No need for separate ETL tools.",
              gradient: "from-aura-500/10 to-transparent",
              border: "hover:border-aura-500/20",
            },
            {
              title: "Data Profiling",
              desc: "Auto-profile every column: nulls, distributions, outliers, top values. Understand your data before visualizing - like a data scientist.",
              gradient: "from-accent-purple/10 to-transparent",
              border: "hover:border-accent-purple/20",
            },
            {
              title: "Looker-Style Dashboards",
              desc: "Multi-widget canvas with scorecards, 12+ chart types, treemaps, gauges, funnels. Cross-filtering between charts.",
              gradient: "from-accent-teal/10 to-transparent",
              border: "hover:border-accent-teal/20",
            },
            {
              title: "Full SQL Power",
              desc: "DuckDB SQL engine - CTEs, window functions, JSON, regex. More powerful than Looker's LookML or Power BI's DAX.",
              gradient: "from-accent-amber/10 to-transparent",
              border: "hover:border-accent-amber/20",
            },
            {
              title: "100% Free & Open",
              desc: "No per-seat licenses. No cloud lock-in. Deploy on Cloudflare's free tier. Your dashboards, your rules.",
              gradient: "from-accent-pink/10 to-transparent",
              border: "hover:border-accent-pink/20",
            },
          ].map((f) => (
            <div
              key={f.title}
              className={`glass rounded-2xl p-5 transition-all duration-300 ${f.border} bg-gradient-to-br ${f.gradient}`}
            >
              <h3 className="font-semibold text-[15px] text-gray-200">{f.title}</h3>
              <p className="text-gray-500 text-[13px] mt-2 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Tech stack */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-4 text-xs text-gray-600">
            {["Cloudflare Pages", "Workers", "D1", "DuckDB-WASM", "React", "ECharts"].map((t, i) => (
              <span key={t} className="flex items-center gap-2">
                {i > 0 && <span className="text-gray-800">+</span>}
                <span className="glass px-3 py-1.5 rounded-lg">{t}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
