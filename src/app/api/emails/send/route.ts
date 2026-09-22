import { NextResponse } from "next/server";
import { getContacts, saveLog } from "@/lib/storage";
import { dispatchEmail } from "@/lib/resend";
import { sendEmailSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const parsed = sendEmailSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { target, targetTag, customEmail, subject, body, from } = parsed.data;

    let recipients: string[] = [];

    if (target === "custom") {
      if (!customEmail) {
        return NextResponse.json({ error: "Custom recipient email is required" }, { status: 400 });
      }
      recipients = [customEmail.trim().toLowerCase()];
    } else {
      const contacts = await getContacts();
      if (target === "tag" && targetTag) {
        recipients = contacts
          .filter((c) => c.tag.toLowerCase() === targetTag.toLowerCase())
          .map((c) => c.email);
      } else {
        recipients = contacts.map((c) => c.email);
      }
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "No recipients found for the selected audience target" },
        { status: 400 }
      );
    }

    const sender = from || process.env.FROM_EMAIL || "onboarding@resend.dev";
    const dispatchResult = await dispatchEmail({
      to: recipients,
      from: sender,
      subject,
      body,
    });

    const logEntry = await saveLog({
      resendId: dispatchResult.resendId || "re_unconfigured_" + Date.now().toString(36),
      to: recipients.length === 1 ? recipients[0] : recipients,
      from: sender,
      subject,
      body,
      status: dispatchResult.success ? "delivered" : "failed",
      error: dispatchResult.error,
      isSimulated: dispatchResult.isSimulated,
    });

    if (!dispatchResult.success) {
      return NextResponse.json(
        {
          error: dispatchResult.error || "Email delivery failed",
          log: logEntry,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      resendId: dispatchResult.resendId,
      recipientCount: recipients.length,
      log: logEntry,
      isSimulated: dispatchResult.isSimulated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: `Invalid configuration: ${message}` },
      { status: 400 }
    );
  }
}
