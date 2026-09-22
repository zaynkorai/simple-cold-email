import fs from "fs/promises";
import path from "path";
import { Contact, EmailLog } from "./types";

declare global {
  var __contactsStore: Contact[] | undefined;
  var __logsStore: EmailLog[] | undefined;
}

const INITIAL_CONTACTS: Contact[] = [
  {
    id: "c1",
    name: "Sarah Connor",
    email: "sarah@cyberdyne.org",
    tag: "VIP",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "c2",
    name: "John Doe",
    email: "john@example.com",
    tag: "Lead",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "c3",
    name: "Emma Watson",
    email: "emma@studio.io",
    tag: "Customer",
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_LOGS: EmailLog[] = [
  {
    id: "l1",
    resendId: "re_8a9b2c3d_sim",
    to: "john@example.com",
    from: "onboarding@resend.dev",
    subject: "Welcome to our platform",
    body: "Hi John,\n\nWelcome to our private beta! We are excited to have you on board.",
    status: "delivered",
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    isSimulated: true,
  },
  {
    id: "l2",
    resendId: "re_4f5e6d7c_sim",
    to: ["sarah@cyberdyne.org", "emma@studio.io"],
    from: "onboarding@resend.dev",
    subject: "Product Roadmap Update",
    body: "Here are the new features planned for release this quarter.",
    status: "delivered",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    isSimulated: true,
  },
];

// In Vercel serverless functions, only /tmp is writable.
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = isServerless ? path.join("/tmp", "salescoach_data") : path.join(process.cwd(), "data");
const CONTACTS_FILE = path.join(DATA_DIR, "contacts.json");
const LOGS_FILE = path.join(DATA_DIR, "logs.json");

// Initialize memory state
if (!global.__contactsStore) {
  global.__contactsStore = [...INITIAL_CONTACTS];
}
if (!global.__logsStore) {
  global.__logsStore = [...INITIAL_LOGS];
}

async function tryWriteFile(filePath: string, content: string): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(filePath, content, "utf-8");
  } catch (err) {
    // If running on a strictly read-only filesystem, memory store serves as fallback
    console.warn("Filesystem write skipped or unavailable in serverless environment:", err);
  }
}

async function tryReadFile(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

export async function getContacts(): Promise<Contact[]> {
  const fileData = await tryReadFile(CONTACTS_FILE);
  if (fileData) {
    try {
      const parsed = JSON.parse(fileData);
      global.__contactsStore = parsed;
      return parsed;
    } catch {}
  }
  return global.__contactsStore || INITIAL_CONTACTS;
}

export async function saveContact(input: Omit<Contact, "id" | "createdAt">): Promise<Contact> {
  const current = await getContacts();
  const newContact: Contact = {
    id: "c_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    tag: input.tag.trim(),
    createdAt: new Date().toISOString(),
  };

  const updated = [newContact, ...current];
  global.__contactsStore = updated;
  await tryWriteFile(CONTACTS_FILE, JSON.stringify(updated, null, 2));

  return newContact;
}

export async function saveContactsBatch(
  items: Array<Omit<Contact, "id" | "createdAt">>
): Promise<{ added: Contact[]; count: number; duplicatesSkipped: number }> {
  const current = await getContacts();
  const existingEmails = new Set(current.map((c) => c.email.toLowerCase()));

  const added: Contact[] = [];
  let duplicatesSkipped = 0;

  for (const item of items) {
    const normalizedEmail = item.email.trim().toLowerCase();
    if (existingEmails.has(normalizedEmail)) {
      duplicatesSkipped++;
      continue;
    }

    const newContact: Contact = {
      id: "c_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: item.name.trim(),
      email: normalizedEmail,
      tag: item.tag.trim() || "Lead",
      createdAt: new Date().toISOString(),
    };

    existingEmails.add(normalizedEmail);
    added.push(newContact);
  }

  if (added.length > 0) {
    const updated = [...added, ...current];
    global.__contactsStore = updated;
    await tryWriteFile(CONTACTS_FILE, JSON.stringify(updated, null, 2));
  }

  return { added, count: added.length, duplicatesSkipped };
}

export async function deleteContact(id: string): Promise<boolean> {
  const current = await getContacts();
  const filtered = current.filter((c) => c.id !== id);
  if (filtered.length === current.length) return false;

  global.__contactsStore = filtered;
  await tryWriteFile(CONTACTS_FILE, JSON.stringify(filtered, null, 2));
  return true;
}

export async function getLogs(): Promise<EmailLog[]> {
  const fileData = await tryReadFile(LOGS_FILE);
  if (fileData) {
    try {
      const parsed = JSON.parse(fileData);
      global.__logsStore = parsed;
      return parsed;
    } catch {}
  }
  return global.__logsStore || INITIAL_LOGS;
}

export async function saveLog(log: Omit<EmailLog, "id" | "createdAt">): Promise<EmailLog> {
  const current = await getLogs();
  const newLog: EmailLog = {
    ...log,
    id: "log_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    createdAt: new Date().toISOString(),
  };

  const updated = [newLog, ...current];
  global.__logsStore = updated;
  await tryWriteFile(LOGS_FILE, JSON.stringify(updated, null, 2));

  return newLog;
}
