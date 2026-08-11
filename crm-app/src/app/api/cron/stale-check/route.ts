import { markStaleDeals } from "@/lib/staleDeals";
import { NextResponse } from "next/server";

// On-demand trigger for the stale-deal check (also runs automatically on a
// schedule via src/instrumentation.ts). Useful for testing or for wiring up
// an external scheduler in deployments where a long-running interval isn't available.
export async function POST() {
  const result = await markStaleDeals();
  return NextResponse.json(result);
}
