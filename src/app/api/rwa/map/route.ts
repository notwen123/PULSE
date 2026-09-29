import { NextResponse, type NextRequest } from "next/server";
import { searchRwa } from "@/lib/api/rwa";
import { badRequest, jsonError } from "@/lib/api/http";

/** GET /api/rwa/map?q=TSLA — resolve a ticker or name to RWA identities via /v5/real-world-assets/map. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length > 64) return badRequest("Query too long");
  try {
    return NextResponse.json(await searchRwa(q));
  } catch (err) {
    return jsonError(err);
  }
}
