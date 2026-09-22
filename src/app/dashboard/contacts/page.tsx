"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Search, X, Loader2, UserCheck, Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import { Contact } from "@/lib/types";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");

  // Single Contact Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalName, setModalName] = useState("");
  const [modalEmail, setModalEmail] = useState("");
  const [modalTag, setModalTag] = useState("Lead");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Bulk Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importMode, setImportMode] = useState<"file" | "paste">("file");
  const [rawCsvText, setRawCsvText] = useState("");
  const [parsedImportRows, setParsedImportRows] = useState<Array<{ name: string; email: string; tag: string }>>([]);
  const [importTagDefault, setImportTagDefault] = useState("Lead");
  const [importSubmitting, setImportSubmitting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let ignore = false;
    async function loadContacts() {
      try {
        const res = await fetch("/api/contacts", { cache: "no-store" });
        const data = await res.json();
        if (!ignore) {
          setContacts(data.contacts || []);
        }
      } catch (err) {
        console.error("Failed to fetch contacts", err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadContacts();
    return () => {
      ignore = true;
    };
  }, []);

  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: modalName,
          email: modalEmail,
          tag: modalTag,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add contact");
      }

      setContacts((prev) => [data.contact, ...prev]);
      setIsModalOpen(false);
      setModalName("");
      setModalEmail("");
      setModalTag("Lead");
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Error saving contact");
    } finally {
      setSubmitting(false);
    }
  }

  function parseCSVContent(text: string, defaultTag: string) {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) return [];

    const rows: Array<{ name: string; email: string; tag: string }> = [];

    // Check if first row is header
    const firstLineCols = lines[0].split(",").map((c) => c.trim().toLowerCase().replace(/^["']|["']$/g, ""));
    const isHeader =
      firstLineCols.includes("email") ||
      firstLineCols.includes("name") ||
      firstLineCols.includes("tag");

    const dataLines = isHeader ? lines.slice(1) : lines;

    // Detect column indexes if header exists
    let nameIdx = 0;
    let emailIdx = 1;
    let tagIdx = 2;

    if (isHeader) {
      const detectedEmail = firstLineCols.findIndex((c) => c.includes("email"));
      const detectedName = firstLineCols.findIndex((c) => c.includes("name"));
      const detectedTag = firstLineCols.findIndex((c) => c.includes("tag") || c.includes("group") || c.includes("segment"));

      if (detectedEmail !== -1) emailIdx = detectedEmail;
      if (detectedName !== -1) nameIdx = detectedName;
      if (detectedTag !== -1) tagIdx = detectedTag;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (const line of dataLines) {
      // Split by comma ignoring comma inside quotes if simple
      const rawCols = line.split(",").map((col) => col.trim().replace(/^["']|["']$/g, ""));
      if (rawCols.length === 0 || !rawCols[0]) continue;

      let extractedEmail = "";
      let extractedName = "";
      let extractedTag = defaultTag;

      if (isHeader) {
        extractedEmail = rawCols[emailIdx] || "";
        extractedName = rawCols[nameIdx] || "";
        extractedTag = rawCols[tagIdx] || defaultTag;
      } else {
        // Find whichever column looks like an email
        const foundEmailIdx = rawCols.findIndex((c) => emailRegex.test(c));
        if (foundEmailIdx !== -1) {
          extractedEmail = rawCols[foundEmailIdx];
          extractedName = rawCols.filter((_, idx) => idx !== foundEmailIdx)[0] || extractedEmail.split("@")[0];
          extractedTag = rawCols[2] || defaultTag;
        } else if (rawCols.length >= 2) {
          extractedName = rawCols[0];
          extractedEmail = rawCols[1];
          extractedTag = rawCols[2] || defaultTag;
        } else if (rawCols.length === 1) {
          extractedEmail = rawCols[0];
          extractedName = rawCols[0].split("@")[0];
        }
      }

      if (emailRegex.test(extractedEmail)) {
        rows.push({
          name: extractedName || extractedEmail.split("@")[0],
          email: extractedEmail.toLowerCase(),
          tag: extractedTag || defaultTag,
        });
      }
    }

    return rows;
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawCsvText(content);
      const parsed = parseCSVContent(content, importTagDefault);
      setParsedImportRows(parsed);
      if (parsed.length === 0) {
        setImportError("No valid rows found in file. Ensure file contains email addresses.");
      }
    };
    reader.onerror = () => {
      setImportError("Failed to read file.");
    };
    reader.readAsText(file);
  }

  function handlePasteChange(text: string) {
    setRawCsvText(text);
    setImportError(null);
    const parsed = parseCSVContent(text, importTagDefault);
    setParsedImportRows(parsed);
  }

  async function handleBulkImport(e: React.FormEvent) {
    e.preventDefault();
    if (parsedImportRows.length === 0) {
      setImportError("No valid contacts to import. Please check your data.");
      return;
    }

    setImportSubmitting(true);
    setImportError(null);

    try {
      const res = await fetch("/api/contacts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts: parsedImportRows }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to import contacts");
      }

      setContacts((prev) => [...data.contacts, ...prev]);
      setImportSuccessMessage(
        `Imported ${data.count} contact${data.count !== 1 ? "s" : ""}${
          data.duplicatesSkipped ? ` (${data.duplicatesSkipped} duplicates skipped)` : ""
        }.`
      );

      setTimeout(() => {
        setIsImportModalOpen(false);
        setRawCsvText("");
        setParsedImportRows([]);
        setImportSuccessMessage(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }, 1200);
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : "Failed to import contacts");
    } finally {
      setImportSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to remove this contact?")) return;

    try {
      const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setContacts((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error("Delete failed", err);
    }
  }

  // Compute unique tags for filter
  const allTags = Array.from(new Set(contacts.map((c) => c.tag)));

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchesTag = selectedTag === "all" || c.tag.toLowerCase() === selectedTag.toLowerCase();
    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-black tracking-tight">Email List</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Manage your recipient audience, contacts, and delivery groups.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsImportModalOpen(true);
              setImportError(null);
              setImportSuccessMessage(null);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 rounded-lg text-sm font-medium transition-colors cursor-pointer shadow-xs"
          >
            <Upload className="w-4 h-4 text-neutral-600" />
            Bulk Import
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add Contact
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-300 rounded-lg text-sm text-black placeholder-neutral-400 focus:outline-none focus:border-black"
          />
        </div>

        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="px-3 py-2 bg-white border border-neutral-300 rounded-lg text-sm text-black focus:outline-none focus:border-black"
        >
          <option value="all">All Tags ({contacts.length})</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-12 text-center text-neutral-500">
            <UserCheck className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
            <p className="text-sm font-medium">No contacts found</p>
            <p className="text-xs text-neutral-400 mt-0.5">
              Add contacts or adjust your search filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase font-semibold text-neutral-600 border-b border-neutral-200">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Tag</th>
                  <th className="px-5 py-3">Date Added</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-black">
                {filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-black">{contact.name}</td>
                    <td className="px-5 py-3.5 text-neutral-600">{contact.email}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-block px-2.5 py-0.5 text-xs rounded bg-neutral-100 border border-neutral-200 text-neutral-800 font-mono">
                        {contact.tag}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-neutral-500">
                      {new Date(contact.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(contact.id)}
                        className="text-neutral-400 hover:text-red-600 transition-colors p-1"
                        title="Delete contact"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white border border-neutral-300 rounded-xl p-6 shadow-xl animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-black">Add New Contact</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-2.5 rounded bg-neutral-100 border border-neutral-300 text-xs text-red-600 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddContact} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-sm text-black focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={modalEmail}
                  onChange={(e) => setModalEmail(e.target.value)}
                  placeholder="alex@company.com"
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-sm text-black focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                  Segmentation Tag
                </label>
                <select
                  value={modalTag}
                  onChange={(e) => setModalTag(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-sm text-black focus:outline-none focus:border-black"
                >
                  <option value="Lead">Lead</option>
                  <option value="Customer">Customer</option>
                  <option value="Partner">Partner</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg text-sm text-neutral-700 hover:bg-neutral-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-black hover:bg-neutral-800 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-xl bg-white border border-neutral-300 rounded-xl p-6 shadow-xl animate-in fade-in zoom-in-95 duration-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-neutral-700" />
                <h3 className="font-bold text-base text-black">Bulk Import Contacts</h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-neutral-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-500 mb-4">
              Import multiple contacts via CSV file upload or direct text paste. Columns supported:{" "}
              <code className="bg-neutral-100 px-1 py-0.5 rounded text-neutral-800 font-mono text-[11px]">
                Name, Email, Tag
              </code>
            </p>

            {importError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <span>{importError}</span>
              </div>
            )}

            {importSuccessMessage && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{importSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleBulkImport} className="space-y-4">
              {/* Mode Toggle */}
              <div className="flex border border-neutral-200 rounded-lg p-1 bg-neutral-50">
                <button
                  type="button"
                  onClick={() => setImportMode("file")}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    importMode === "file"
                      ? "bg-white text-black shadow-xs font-semibold"
                      : "text-neutral-600 hover:text-black"
                  }`}
                >
                  Upload CSV File
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode("paste")}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    importMode === "paste"
                      ? "bg-white text-black shadow-xs font-semibold"
                      : "text-neutral-600 hover:text-black"
                  }`}
                >
                  Paste CSV / Text
                </button>
              </div>

              {/* Default Tag Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                  Default Tag (for rows without tag)
                </label>
                <select
                  value={importTagDefault}
                  onChange={(e) => {
                    setImportTagDefault(e.target.value);
                    if (rawCsvText) {
                      const rechecked = parseCSVContent(rawCsvText, e.target.value);
                      setParsedImportRows(rechecked);
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-sm text-black focus:outline-none focus:border-black"
                >
                  <option value="Lead">Lead</option>
                  <option value="Customer">Customer</option>
                  <option value="Partner">Partner</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>

              {/* File upload mode */}
              {importMode === "file" ? (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                    Select CSV File
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-neutral-300 hover:border-neutral-400 rounded-xl p-6 text-center cursor-pointer transition-colors bg-neutral-50/50 hover:bg-neutral-50"
                  >
                    <Upload className="w-8 h-8 mx-auto mb-2 text-neutral-400" />
                    <p className="text-sm font-medium text-neutral-700">
                      Click to choose a CSV file
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">.csv or .txt files up to 500 rows</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,text/csv,text/plain"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </div>
              ) : (
                /* Paste mode */
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                    Paste CSV Content
                  </label>
                  <textarea
                    rows={5}
                    value={rawCsvText}
                    onChange={(e) => handlePasteChange(e.target.value)}
                    placeholder={"Name,Email,Tag\nAlex Smith,alex@company.com,Lead\nJane Doe,jane@acme.org,VIP"}
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs font-mono text-black focus:outline-none focus:border-black resize-y"
                  />
                </div>
              )}

              {/* Parsed Preview */}
              {parsedImportRows.length > 0 && (
                <div className="border border-neutral-200 rounded-lg overflow-hidden">
                  <div className="bg-neutral-50 px-3 py-2 text-xs font-medium text-neutral-700 flex justify-between items-center border-b border-neutral-200">
                    <span>Parsed Preview ({parsedImportRows.length} contacts found)</span>
                    <span className="text-[11px] text-neutral-500">Showing first 5</span>
                  </div>
                  <div className="max-h-36 overflow-y-auto divide-y divide-neutral-100 text-xs">
                    {parsedImportRows.slice(0, 5).map((row, idx) => (
                      <div key={idx} className="px-3 py-2 flex items-center justify-between text-neutral-800">
                        <div>
                          <span className="font-medium">{row.name}</span>
                          <span className="text-neutral-500 ml-2">&lt;{row.email}&gt;</span>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] rounded bg-neutral-100 font-mono text-neutral-600">
                          {row.tag}
                        </span>
                      </div>
                    ))}
                  </div>
                  {parsedImportRows.length > 5 && (
                    <div className="p-2 text-center text-[11px] text-neutral-400 bg-neutral-50 border-t border-neutral-100">
                      + {parsedImportRows.length - 5} more contact(s) ready to import
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg text-sm text-neutral-700 hover:bg-neutral-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importSubmitting || parsedImportRows.length === 0}
                  className="px-4 py-2 bg-black hover:bg-neutral-800 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {importSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Import {parsedImportRows.length > 0 ? `${parsedImportRows.length} Contacts` : "Contacts"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
