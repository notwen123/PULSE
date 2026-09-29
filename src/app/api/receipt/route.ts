import { NextResponse, type NextRequest } from "next/server";
import { getPassport } from "@/lib/api/rwa";
import { badRequest, jsonError, parseRwaIds } from "@/lib/api/http";
import { isCurrency } from "@/lib/currency";

const FIELDS = ["rwa_id", "average_tokenized_price", "tokenized_market_cap", "tokenized_volume_24h"] as const;

/**
 * GET /api/receipt?rwa_id=9&field=average_tokenized_price[&crypto_id=40238]
 * Returns the data receipt for one Passport value.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const ids = parseRwaIds(sp.get("rwa_id"), 1);
  if (!ids) return badRequest("rwa_id must be a single positive integer");
  const field = sp.get("field") ?? "average_tokenized_price";
  const cryptoId = sp.get("crypto_id");
  if (!cryptoId && !(FIELDS as readonly string[]).includes(field)) return badRequest(`field must be one of ${FIELDS.join(", ")}`);
  const convert = sp.get("convert")?.toLowerCase() ?? "usd";
  try {
    const p = await getPassport(ids[0], isCurrency(convert) ? convert : "usd");
    if (cryptoId) {
      const t = p.tokens.find((x) => String(x.cryptoId) === cryptoId);
      return t?.priceReceipt ? NextResponse.json(t.priceReceipt) : badRequest("crypto_id is not a tracked representation of this RWA");
    }
    if (field === "rwa_id") return NextResponse.json(p.identityReceipt);
    if (!p.aggregate) return NextResponse.json({ error: { kind: "not_found", title: "Quote unavailable" } }, { status: 404 });
    const map = {
      average_tokenized_price: p.aggregate.receipts.averageTokenizedPrice,
      tokenized_market_cap: p.aggregate.receipts.tokenizedMarketCap,
      tokenized_volume_24h: p.aggregate.receipts.tokenizedVolume24h,
    } as const;
    return NextResponse.json(map[field as keyof typeof map]);
  } catch (err) {
    return jsonError(err);
  }
}
