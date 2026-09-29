import { NextResponse, type NextRequest } from "next/server";
import { getPassport } from "@/lib/api/rwa";
import { badRequest, jsonError, parseRwaIds } from "@/lib/api/http";
import { isCurrency } from "@/lib/currency";

/** GET /api/rwa/passport?rwa_id=14&convert=usd — the full normalized Passport (used by the landing decoder). */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const ids = parseRwaIds(sp.get("rwa_id"), 1);
  if (!ids) return badRequest("rwa_id must be a single positive integer");
  const convert = sp.get("convert")?.toLowerCase() ?? "usd";
  try {
    return NextResponse.json(await getPassport(ids[0], isCurrency(convert) ? convert : "usd"));
  } catch (err) {
    return jsonError(err);
  }
}
