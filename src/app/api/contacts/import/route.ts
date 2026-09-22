import { NextResponse } from "next/server";
import { saveContactsBatch } from "@/lib/storage";
import { batchContactSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = batchContactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { added, count, duplicatesSkipped } = await saveContactsBatch(
      parsed.data.contacts.map((c) => ({
        name: c.name,
        email: c.email,
        tag: c.tag || "Lead",
      }))
    );

    return NextResponse.json(
      {
        contacts: added,
        count,
        duplicatesSkipped,
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch {
    return NextResponse.json({ error: "Failed to import contacts" }, { status: 500 });
  }
}
