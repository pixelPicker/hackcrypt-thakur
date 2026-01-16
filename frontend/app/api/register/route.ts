import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { name, email: rawEmail, password } = await req.json();
    const email = String(rawEmail || "").trim().toLowerCase();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log("[register] created user:", { id: data.user?.id, email: data.user?.email });
    return NextResponse.json({ user: data.user }, { status: 201 });
  } catch (e: any) {
    console.error("[register] error:", e?.message || e);
    return NextResponse.json(
      { error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
