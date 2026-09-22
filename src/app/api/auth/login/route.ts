import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input. Please enter a valid email and password." },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const hasAdminConfig = Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);
    const expectedEmail = process.env.ADMIN_EMAIL || "demo@client.com";
    const expectedPassword = process.env.ADMIN_PASSWORD || "password123";

    if (email !== expectedEmail || password !== expectedPassword) {
      const configHint = !hasAdminConfig
        ? " Environment variables ADMIN_EMAIL / ADMIN_PASSWORD are not set; default demo credentials are demo@client.com / password123."
        : "";

      return NextResponse.json(
        { error: `Invalid credentials.${configHint}` },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set("session_token", Buffer.from(`${email}:${Date.now()}`).toString("base64"), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json(
      { success: true, email },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Authentication service error. Please try again." },
      { status: 400 }
    );
  }
}
