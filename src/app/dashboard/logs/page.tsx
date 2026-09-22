"use client";

import { useEffect, useState } from "react";
import { Search, FileText, CheckCircle2, AlertCircle, X, Loader2, RefreshCw } from "lucide-react";
import { EmailLog } from "@/lib/types";

export default function DeliveryLogsPage() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  async function refreshLogs() {
    setLoading(true);
    try {
      const res = await fetch("/api/emails/logs", { cache: "no-store" });
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error("Failed to retrieve delivery logs", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;
    async function loadLogs() {
      try {
        const res = await fetch("/api/emails/logs", { cache: "no-store" });
        const data = await res.json();
        if (!ignore) {
          setLogs(data.logs || []);
        }
      } catch (err) {
        console.error("Failed to retrieve delivery logs", err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadLogs();
    return () => {
      ignore = true;
    };
  }, []);

  const filteredLogs = logs.filter((log) => {
    const term = search.toLowerCase();
    const recipientStr = Array.isArray(log.to) ? log.to.join(" ") : log.to;
    return (
      log.subject.toLowerCase().includes(term) ||
      recipientStr.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-black tracking-tight">Delivery Logs</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Audit history, Resend message identifiers, and transmission status.
          </p>
        </div>
        <button
          onClick={refreshLogs}
          className="inline-flex items-center gap-2 px-3.5 py-2 border border-neutral-300 hover:bg-neutral-100 rounded-lg text-sm font-medium text-black transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          placeholder="Filter by Recipient, or subject..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-300 rounded-lg text-sm text-black placeholder-neutral-400 focus:outline-none focus:border-black"
        />
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-neutral-500">
            <FileText className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
            <p className="text-sm font-medium">No delivery records found</p>
            <p className="text-xs text-neutral-400 mt-0.5">
              Dispatched emails will appear here with Resend tracking IDs.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase font-semibold text-neutral-600 border-b border-neutral-200">
                <tr>
                  <th className="px-5 py-3">Recipient(s)</th>
                  <th className="px-5 py-3">Subject</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-black">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-5 py-3.5 text-neutral-800 truncate max-w-[220px]">
                      {Array.isArray(log.to) ? log.to.join(", ") : log.to}
                    </td>
                    <td className="px-5 py-3.5 text-neutral-600 truncate max-w-[220px]">
                      {log.subject}
                    </td>
                    <td className="px-5 py-3.5">
                      {log.status === "delivered" || log.status === "sent" ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Delivered
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-800 border border-red-200">
                          <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-neutral-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString([], {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-xs font-medium text-black hover:underline cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white border border-neutral-300 rounded-xl p-6 shadow-xl animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between mb-4 border-b border-neutral-200 pb-3">
              <div>
                <h3 className="font-bold text-base text-black">Delivery Details</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-neutral-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <span className="font-semibold text-neutral-500 uppercase tracking-wider block mb-0.5">
                  Recipient(s)
                </span>
                <p className="text-black font-medium text-sm">
                  {Array.isArray(selectedLog.to)
                    ? selectedLog.to.join(", ")
                    : selectedLog.to}
                </p>
              </div>

              <div>
                <span className="font-semibold text-neutral-500 uppercase tracking-wider block mb-0.5">
                  Sender
                </span>
                <p className="text-neutral-800 font-mono">{selectedLog.from}</p>
              </div>

              <div>
                <span className="font-semibold text-neutral-500 uppercase tracking-wider block mb-0.5">
                  Subject
                </span>
                <p className="text-black font-medium">{selectedLog.subject}</p>
              </div>

              <div>
                <span className="font-semibold text-neutral-500 uppercase tracking-wider block mb-0.5">
                  Dispatched At
                </span>
                <p className="text-neutral-700">
                  {new Date(selectedLog.createdAt).toLocaleString()}
                </p>
              </div>

              <div>
                <span className="font-semibold text-neutral-500 uppercase tracking-wider block mb-0.5">
                  Message Body
                </span>
                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg whitespace-pre-wrap text-neutral-800 font-sans max-h-48 overflow-y-auto">
                  {selectedLog.body}
                </div>
              </div>

              {selectedLog.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <span className="font-semibold block mb-0.5">Error Message:</span>
                  {selectedLog.error}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 mt-2 border-t border-neutral-200">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
