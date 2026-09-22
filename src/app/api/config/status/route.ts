import { NextResponse } from "next/server";
import { isResendConfigured } from "@/lib/resend";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const hasResend = isResendConfigured();
  const hasAdmin = Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);
  const fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev";

  return NextResponse.json(
    {
      configured: hasResend,
      resendConfigured: hasResend,
      adminConfigured: hasAdmin,
      fromEmail,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
