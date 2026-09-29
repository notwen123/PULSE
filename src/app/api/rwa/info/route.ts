import { NextResponse, type NextRequest } from "next/server";
import { getProfile } from "@/lib/api/rwa";
import { badRequest, jsonError, parseRwaIds } from "@/lib/api/http";

/** GET /api/rwa/info?rwa_id=9 — static metadata via /v5/real-world-assets/info. */
export async function GET(req: NextRequest) {
  const ids = parseRwaIds(req.nextUrl.searchParams.get("rwa_id"), 1);
  if (!ids) return badRequest("rwa_id must be a single positive integer");
  try {
    return NextResponse.json(await getProfile(ids[0]));
  } catch (err) {
    return jsonError(err);
  }
}
