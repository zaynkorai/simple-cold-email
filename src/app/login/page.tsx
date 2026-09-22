"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@client.com");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center p-6">
      <div className="w-full max-w-md border border-neutral-300 rounded-xl p-8 bg-white shadow-xs">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-neutral-100 text-black mb-3 border border-neutral-200">
            <Mail className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-black">Email Dispatcher</h1>
          <p className="text-sm text-neutral-500 mt-1">Email Delivery Console</p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-neutral-100 border border-neutral-300 text-xs text-red-600 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-black placeholder-neutral-400 focus:outline-none focus:border-black transition-colors"
              placeholder="you@domain.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-black focus:outline-none focus:border-black transition-colors"
            />
          </div>

          <div className="text-xs text-neutral-500 pt-1">
            Demo credentials pre-filled for immediate testing.
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-black hover:bg-neutral-800 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
