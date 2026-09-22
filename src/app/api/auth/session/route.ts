import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const decoded = Buffer.from(sessionToken, "base64").toString("utf-8");
    const [email] = decoded.split(":");
    return NextResponse.json(
      { authenticated: true, email },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
