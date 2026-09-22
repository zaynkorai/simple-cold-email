"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Send, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { Contact, EmailLog } from "@/lib/types";

export default function DashboardOverviewPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [cRes, lRes] = await Promise.all([
          fetch("/api/contacts", { cache: "no-store" }),
          fetch("/api/emails/logs", { cache: "no-store" }),
        ]);
        const cData = await cRes.json();
        const lData = await lRes.json();
        setContacts(cData.contacts || []);
        setLogs(lData.logs || []);
      } catch (err) {
        console.error("Failed to load overview data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  const deliveredCount = logs.filter((l) => l.status === "delivered").length;

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-black tracking-tight">Overview</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Monitor your recipient database, dispatch campaigns, and view delivery metrics.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 border border-neutral-200 rounded-xl bg-white shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Contacts</span>
            <Users className="w-4 h-4 text-black" />
          </div>
          <div className="text-3xl font-bold text-black">{contacts.length}</div>
          <div className="text-xs text-neutral-500 mt-1">Available recipients</div>
        </div>

        <div className="p-5 border border-neutral-200 rounded-xl bg-white shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Emails Delivered</span>
            <Send className="w-4 h-4 text-black" />
          </div>
          <div className="text-3xl font-bold text-black">{deliveredCount}</div>
          <div className="text-xs text-neutral-500 mt-1">Via Resend API</div>
        </div>

        <div className="p-5 border border-neutral-200 rounded-xl bg-white shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Engine Status</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-black mt-1">Resend Ready</div>
          <div className="text-xs text-neutral-500 mt-1">API dispatch online</div>
        </div>
      </div>

      {/* Quick Action Hub */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-6 border border-neutral-200 rounded-xl bg-neutral-50 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-black">Compose & Dispatch</h3>
            <p className="text-sm text-neutral-600 mt-1">
              Send personalized or bulk updates to your audience via Resend.
            </p>
          </div>
          <div className="mt-5">
            <Link
              href="/dashboard/send"
              className="inline-flex items-center gap-2 px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Open Email Composer
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="p-6 border border-neutral-200 rounded-xl bg-neutral-50 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-black">Audience Management</h3>
            <p className="text-sm text-neutral-600 mt-1">
              Add new recipients, assign segmentation tags, or delete inactive contacts.
            </p>
          </div>
          <div className="mt-5">
            <Link
              href="/dashboard/contacts"
              className="inline-flex items-center gap-2 px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Manage Email List
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Dispatches Preview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-black">Recent Deliveries</h2>
          <Link
            href="/dashboard/logs"
            className="text-xs font-semibold text-neutral-600 hover:text-black flex items-center gap-1"
          >
            View All
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase font-semibold text-neutral-600 border-b border-neutral-200">
              <tr>
                <th className="px-5 py-3">Recipient</th>
                <th className="px-5 py-3">Subject</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {logs.slice(0, 3).map((log) => (
                <tr key={log.id} className="hover:bg-neutral-50">
                  <td className="px-5 py-3 text-neutral-800 truncate max-w-[200px]">
                    {Array.isArray(log.to) ? log.to.join(", ") : log.to}
                  </td>
                  <td className="px-5 py-3 text-neutral-600 truncate max-w-[250px]">
                    {log.subject}
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
