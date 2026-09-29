import { NextResponse } from "next/server";
import { listIssuers } from "@/lib/api/rwa";
import { jsonError } from "@/lib/api/http";

/** GET /api/rwa/issuers — token issuers via /v5/real-world-assets/issuers/list. */
export async function GET() {
  try {
    return NextResponse.json(await listIssuers());
  } catch (err) {
    return jsonError(err);
  }
}
