"use client";

import { useEffect, useState } from "react";
import { Send, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Contact } from "@/lib/types";

export default function SendEmailPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [target, setTarget] = useState<"all" | "tag" | "custom">("all");
  const [targetTag, setTargetTag] = useState<string>("");
  const [customEmail, setCustomEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    resendId?: string;
    recipientCount?: number;
    error?: string;
    isSimulated?: boolean;
  } | null>(null);

  useEffect(() => {
    async function fetchContacts() {
      try {
        const res = await fetch("/api/contacts");
        const data = await res.json();
        setContacts(data.contacts || []);
        const tags = Array.from(new Set((data.contacts || []).map((c: Contact) => c.tag)));
        if (tags.length > 0) setTargetTag(tags[0] as string);
      } catch (err) {
        console.error("Failed to load contacts", err);
      }
    }
    fetchContacts();
  }, []);

  const tags = Array.from(new Set(contacts.map((c) => c.tag)));

  const computedRecipientCount =
    target === "custom"
      ? customEmail.trim() ? 1 : 0
      : target === "tag"
      ? contacts.filter((c) => c.tag.toLowerCase() === targetTag.toLowerCase()).length
      : contacts.length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const payload = {
        target,
        targetTag: target === "tag" ? targetTag : undefined,
        customEmail: target === "custom" ? customEmail : undefined,
        subject,
        body,
      };

      const res = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch email");
      }

      setResult({
        success: true,
        resendId: data.resendId,
        recipientCount: data.recipientCount,
        isSimulated: data.isSimulated,
      });

      // Clear form on success
      setSubject("");
      setBody("");
    } catch (err: unknown) {
      setResult({
        success: false,
        error: err instanceof Error ? err.message : "Error dispatching email",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="border-b border-neutral-200 pb-5">
        <h1 className="text-2xl font-bold text-black tracking-tight">Send Email</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Compose and dispatch emails through the Resend API engine.
        </p>
      </div>

      {result && result.success && (
        <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-300 space-y-2">
          <div className="flex items-center gap-2 text-black font-semibold text-sm">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            Email Dispatched Successfully
          </div>
          <p className="text-xs text-neutral-600">
            Delivered to <span className="font-semibold text-black">{result.recipientCount}</span> recipient(s).
            Resend Message ID: <span className="font-mono font-medium text-black">{result.resendId}</span>
            {result.isSimulated && (
              <span className="ml-2 px-2 py-0.5 rounded bg-neutral-200 text-neutral-700 text-[11px]">
                Demo Mode
              </span>
            )}
          </p>
          <div className="pt-1">
            <Link
              href="/dashboard/logs"
              className="inline-flex items-center gap-1 text-xs font-semibold text-black hover:underline"
            >
              View in Delivery Logs <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {result && !result.success && (
        <div className="p-4 rounded-xl bg-neutral-50 border border-red-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <div className="font-semibold text-red-600">Failed to send email</div>
            <p className="text-neutral-700">{result.error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-neutral-200 p-6 rounded-xl shadow-xs">
        {/* Audience Target */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700">
            Target Audience
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setTarget("all")}
              className={`p-3 text-left border rounded-lg transition-colors cursor-pointer ${
                target === "all"
                  ? "border-black bg-neutral-100 font-semibold text-black"
                  : "border-neutral-300 hover:bg-neutral-50 text-neutral-700"
              }`}
            >
              <div className="text-xs font-medium">All Contacts</div>
              <div className="text-[11px] text-neutral-500 mt-0.5">{contacts.length} recipients</div>
            </button>

            <button
              type="button"
              onClick={() => setTarget("tag")}
              className={`p-3 text-left border rounded-lg transition-colors cursor-pointer ${
                target === "tag"
                  ? "border-black bg-neutral-100 font-semibold text-black"
                  : "border-neutral-300 hover:bg-neutral-50 text-neutral-700"
              }`}
            >
              <div className="text-xs font-medium">By Tag / Segment</div>
              <div className="text-[11px] text-neutral-500 mt-0.5">Filter by audience tag</div>
            </button>

            <button
              type="button"
              onClick={() => setTarget("custom")}
              className={`p-3 text-left border rounded-lg transition-colors cursor-pointer ${
                target === "custom"
                  ? "border-black bg-neutral-100 font-semibold text-black"
                  : "border-neutral-300 hover:bg-neutral-50 text-neutral-700"
              }`}
            >
              <div className="text-xs font-medium">Custom Recipient</div>
              <div className="text-[11px] text-neutral-500 mt-0.5">Single email address</div>
            </button>
          </div>
        </div>

        {/* Tag Selector if tag chosen */}
        {target === "tag" && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
              Select Audience Tag
            </label>
            <select
              value={targetTag}
              onChange={(e) => setTargetTag(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-sm text-black focus:outline-none focus:border-black"
            >
              {tags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag} ({contacts.filter((c) => c.tag.toLowerCase() === tag.toLowerCase()).length}{" "}
                  contacts)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Custom email input if chosen */}
        {target === "custom" && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
              Recipient Email Address
            </label>
            <input
              type="email"
              required
              value={customEmail}
              onChange={(e) => setCustomEmail(e.target.value)}
              placeholder="client@destination.com"
              className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-sm text-black focus:outline-none focus:border-black"
            />
          </div>
        )}

        {/* Subject */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
            Subject
          </label>
          <input
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Important update for your account..."
            className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-black placeholder-neutral-400 focus:outline-none focus:border-black"
          />
        </div>

        {/* Message Body */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700">
              Message Content
            </label>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs text-neutral-600 hover:text-black flex items-center gap-1 font-medium cursor-pointer"
            >
              {showPreview ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" /> Edit
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" /> Preview
                </>
              )}
            </button>
          </div>

          {showPreview ? (
            <div className="min-h-[200px] p-4 border border-neutral-300 rounded-lg bg-neutral-50 text-sm whitespace-pre-wrap font-sans text-neutral-900">
              {body || <span className="text-neutral-400 italic">No content to preview...</span>}
            </div>
          ) : (
            <textarea
              rows={8}
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Hi there,&#10;&#10;We wanted to reach out regarding..."
              className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-black focus:outline-none focus:border-black font-sans leading-relaxed"
            />
          )}
        </div>

        {/* Footer info and Submit */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-neutral-200">
          <div className="text-xs text-neutral-500">
            Audience: <span className="font-semibold text-black">{computedRecipientCount}</span> recipient(s)
          </div>

          <button
            type="submit"
            disabled={loading || computedRecipientCount === 0}
            className="px-5 py-2.5 bg-black hover:bg-neutral-800 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Dispatch Email
          </button>
        </div>
      </form>
    </div>
  );
}
