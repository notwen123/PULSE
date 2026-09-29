import { NextResponse, type NextRequest } from "next/server";
import { VERIFY_QUERIES, toVerifyJson, verify, type VerifyQuery } from "@/lib/api/verify";
import { badRequest, jsonError } from "@/lib/api/http";

/**
 * GET /api/verify?q=rwa-quote&symbol=TSLA
 * Machine-readable verification for agents and scripts. Every answer carries
 * source, endpoint, timestamps, identifier, response hash and credit count.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q");
  if (!q) return NextResponse.json({ queries: VERIFY_QUERIES, example: "/api/verify?q=rwa-quote&symbol=TSLA" });
  if (!(VERIFY_QUERIES as readonly string[]).includes(q)) return badRequest(`q must be one of ${VERIFY_QUERIES.join(", ")}`);
  try {
    const { query, answer, receipt } = await verify(q as VerifyQuery, sp);
    return NextResponse.json(toVerifyJson(query, answer, receipt));
  } catch (err) {
    return jsonError(err);
  }
}
