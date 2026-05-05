import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const expected =
    process.env.INTERNAL_REVALIDATE_TOKEN ?? process.env.INTERNAL_TOKEN;
  let body: { token?: string; storySlug?: string } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  if (!expected || body.token !== expected) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (body.storySlug) {
    revalidateTag(`story:${body.storySlug}`);
  }
  return NextResponse.json({ ok: true });
}
