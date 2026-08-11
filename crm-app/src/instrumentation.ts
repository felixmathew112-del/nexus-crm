export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startStaleDealScheduler } = await import("@/lib/staleDeals");
    startStaleDealScheduler();
  }
}
