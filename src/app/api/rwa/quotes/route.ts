import { NextResponse, type NextRequest } from "next/server";
import { quoteSnapshots } from "@/lib/api/rwa";
import { badRequest, jsonError, parseRwaIds } from "@/lib/api/http";
import { isCurrency } from "@/lib/currency";

/** GET /api/rwa/quotes?rwa_id=1,2&convert=usd — batched quotes via /v5/real-world-assets/quotes/latest. */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const ids = parseRwaIds(sp.get("rwa_id"));
  if (!ids) return badRequest("rwa_id must be comma-separated positive integers (max 50)");
  const convert = sp.get("convert")?.toLowerCase() ?? "usd";
  try {
    return NextResponse.json(await quoteSnapshots(ids, isCurrency(convert) ? convert : "usd"));
  } catch (err) {
    return jsonError(err);
  }
}
