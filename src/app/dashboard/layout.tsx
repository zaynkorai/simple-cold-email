"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Users, Send, FileText, LayoutDashboard, LogOut, Mail } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("demo@client.com");

  useEffect(() => {
    let ignore = false;
    async function loadSession() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          if (!ignore && data.email) {
            setUserEmail(data.email);
          }
        }
      } catch {}
    }
    loadSession();
    return () => {
      ignore = true;
    };
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const navItems = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Email List", href: "/dashboard/contacts", icon: Users },
    { label: "Send Email", href: "/dashboard/send", icon: Send },
    { label: "Delivery Logs", href: "/dashboard/logs", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-white text-black flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-neutral-50 border-r border-neutral-200 p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold text-sm">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm text-black leading-tight">Email Dispatcher</div>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-neutral-200 text-black border border-neutral-300 font-semibold"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-neutral-200 pt-4 px-2 flex items-center justify-between text-xs text-neutral-500">
          <div className="truncate max-w-[140px] font-mono">{userEmail}</div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-neutral-500 hover:text-black font-medium transition-colors cursor-pointer"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 p-6 md:p-8 bg-white overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
