import { NextResponse } from "next/server";
import { getContacts, saveContact } from "@/lib/storage";
import { contactSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const contacts = await getContacts();
    return NextResponse.json(
      { contacts },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch {
    return NextResponse.json({ error: "Failed to retrieve contacts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const created = await saveContact(parsed.data);
    return NextResponse.json(
      { contact: created },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch {
    return NextResponse.json({ error: "Failed to create contact" }, { status: 500 });
  }
}
