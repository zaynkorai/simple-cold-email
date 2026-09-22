import { NextResponse } from "next/server";
import { deleteContact } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const deleted = await deleteContact(id);

    if (!deleted) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, id },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch {
    return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 });
  }
}
