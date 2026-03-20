import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/lib/store";
import { useEffect } from "react";

export function Navbar() {
  const { user, logout, hydrate } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => { hydrate(); }, [hydrate]);

  return (
    <nav className="border-b border-white/[0.04] bg-surface-0/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-5 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-aura-500 to-aura-700 flex items-center justify-center font-bold text-white text-sm shadow-glow group-hover:shadow-glow-lg transition-shadow">
            A
          </div>
          <span className="font-semibold text-[15px] tracking-tight">
            Aura<span className="text-aura-400">BI</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/dashboard" className="btn-ghost text-[13px]">Dashboard</Link>
              <div className="h-4 w-px bg-white/[0.06]" />
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-aura-500/30 to-aura-700/20 flex items-center justify-center text-xs font-medium text-aura-300 border border-aura-500/20">
                  {(user.displayName || user.email)[0].toUpperCase()}
                </div>
                <span className="chip">{user.tier}</span>
              </div>
              <button onClick={() => { logout(); navigate("/"); }} className="btn-ghost text-[13px] text-gray-500">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost text-[13px]">Sign in</Link>
              <Link to="/register" className="btn-primary text-[13px] py-1.5">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
