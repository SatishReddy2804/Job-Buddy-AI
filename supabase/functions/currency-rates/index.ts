import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.5,
  JPY: 157,
  CAD: 1.37,
  AUD: 1.52,
  SGD: 1.35,
  BRL: 5.05,
  CHF: 0.88,
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const base = (body.base ?? "USD").toUpperCase();

    let rates: Record<string, number> = FALLBACK_RATES;

    try {
      const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${base}`, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.rates === "object" && data.rates !== null) {
          rates = { [base]: 1, ...(data.rates as Record<string, number>) };
        }
      }
    } catch {
      // network or parse failure — fall back to static rates
    }

    return new Response(JSON.stringify({ base, rates, fetched_at: new Date().toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
