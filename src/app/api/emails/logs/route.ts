import { NextResponse } from "next/server";
import { getLogs } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const logs = await getLogs();
    return NextResponse.json(
      { logs },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch {
    return NextResponse.json({ error: "Failed to retrieve logs" }, { status: 500 });
  }
}
