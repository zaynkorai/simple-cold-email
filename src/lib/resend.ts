import { Resend } from "resend";

export interface SendResult {
  success: boolean;
  resendId: string;
  error?: string;
  isSimulated?: boolean;
}

export function isResendConfigured(): boolean {
  const apiKey = process.env.RESEND_API_KEY;
  return Boolean(
    apiKey &&
    apiKey.trim() !== "" &&
    apiKey !== "re_test_placeholder" &&
    !apiKey.includes("placeholder")
  );
}

export async function dispatchEmail({
  to,
  from,
  subject,
  body,
}: {
  to: string | string[];
  from?: string;
  subject: string;
  body: string;
}): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const sender = from || process.env.FROM_EMAIL || "onboarding@resend.dev";

  if (!isResendConfigured()) {
    return {
      success: false,
      resendId: "",
      error: "Invalid configuration: RESEND_API_KEY is not set in environment variables. Please add your Resend API key to project environment variables.",
    };
  }

  try {
    const resend = new Resend(apiKey);
    const recipients = Array.isArray(to) ? to : [to];

    const { data, error } = await resend.emails.send({
      from: sender,
      to: recipients,
      subject,
      text: body,
      html: body.replace(/\n/g, "<br>"),
    });

    if (error) {
      return {
        success: false,
        resendId: "",
        error: `Resend delivery failed: ${error.message}`,
      };
    }

    return {
      success: true,
      resendId: data?.id || "re_" + Math.random().toString(36).substring(2, 10),
      isSimulated: false,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to communicate with Resend API";
    return {
      success: false,
      resendId: "",
      error: `Invalid configuration or network error: ${message}`,
    };
  }
}
