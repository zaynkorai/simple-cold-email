import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("session_token");
  return NextResponse.json(
    { success: true },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
