import { NextResponse } from "next/server";
import { authenticateUser, createSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const user = await authenticateUser(email, password);
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await createSession(user);

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
