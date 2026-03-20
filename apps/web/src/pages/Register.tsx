import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

export function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { token, user } = await api.auth.register(email, password, displayName);
      setAuth(user, token);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-sm text-gray-500 mt-1">Start analyzing data in seconds</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-red-400/90 text-sm bg-red-500/[0.06] border border-red-500/10 rounded-xl px-4 py-3">{error}</div>
          )}
          <div>
            <label className="block text-xs text-gray-400 font-medium mb-1.5">Display Name</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="input w-full" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 font-medium mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input w-full" required />
          </div>
          <div>
            <label className="block text-xs text-gray-400 font-medium mb-1.5">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input w-full" required minLength={8} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 disabled:opacity-50">
            {loading ? "Creating..." : "Create Account"}
          </button>
          <p className="text-sm text-gray-500 text-center">
            Already have an account? <Link to="/login" className="text-aura-400 hover:text-aura-300 transition">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
