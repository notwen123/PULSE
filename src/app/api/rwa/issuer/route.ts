import { NextResponse, type NextRequest } from "next/server";
import { getIssuer } from "@/lib/api/rwa";
import { jsonError } from "@/lib/api/http";

/** GET /api/rwa/issuer?issuer_id=… — one issuer with linked tokens via /v5/real-world-assets/issuers. */
export async function GET(req: NextRequest) {
  try {
    return NextResponse.json(await getIssuer(req.nextUrl.searchParams.get("issuer_id") ?? ""));
  } catch (err) {
    return jsonError(err);
  }
}
