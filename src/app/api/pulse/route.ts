import { NextResponse, type NextRequest } from "next/server";
import { getDailyPulse } from "@/lib/api/global";
import { isCurrency } from "@/lib/currency";

/** GET /api/pulse?convert=usd — Fear & Greed, Altcoin Season and global metrics, each with a receipt. */
export async function GET(req: NextRequest) {
  const convert = req.nextUrl.searchParams.get("convert")?.toLowerCase() ?? "usd";
  return NextResponse.json(await getDailyPulse(isCurrency(convert) ? convert : "usd"));
}
