import { NextResponse, type NextRequest } from "next/server";
import { listRwas } from "@/lib/api/rwa";
import { jsonError } from "@/lib/api/http";
import { isCurrency } from "@/lib/currency";

const TYPES = ["stock", "commodity", "currency", "government_security", "etf", "real_estate"];

/** GET /api/rwa/list?asset_type=stock&convert=usd — tracked RWAs via /v5/real-world-assets/assets/list. */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const type = sp.get("asset_type") ?? undefined;
  const convert = sp.get("convert")?.toLowerCase() ?? "usd";
  try {
    return NextResponse.json(
      await listRwas({ currency: isCurrency(convert) ? convert : "usd", assetType: type && TYPES.includes(type) ? type : undefined })
    );
  } catch (err) {
    return jsonError(err);
  }
}
