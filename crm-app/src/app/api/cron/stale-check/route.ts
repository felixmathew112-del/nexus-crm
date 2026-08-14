import { markStaleDeals } from "@/lib/staleDeals";
import { NextResponse } from "next/server";

function isAuthorized(req: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // unset - fine for local dev, not for a real deployment
  return req.headers.get("authorization") === `Bearer ${cronSecret}`;
}

// Vercel Cron Jobs (see vercel.json) send a GET request on their schedule -
// the reliable trigger in a serverless deployment, where the in-process
// setInterval in instrumentation.ts can't be trusted to stay alive between
// requests.
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await markStaleDeals();
  return NextResponse.json(result);
}

// On-demand trigger for the stale-deal check (also runs automatically on a
// schedule via src/instrumentation.ts, and hourly via the Vercel Cron Job
// above). Useful for testing or for wiring up an external scheduler in
// deployments where a long-running interval isn't available.
export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await markStaleDeals();
  return NextResponse.json(result);
}
