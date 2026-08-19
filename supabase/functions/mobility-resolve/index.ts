import { withSupabase } from "npm:@supabase/server";

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
      "access-control-allow-methods": "POST, OPTIONS",
    },
  });
}

function finiteNumber(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

const protectedHandler = withSupabase({ auth: "publishable" }, async (req, ctx) => {
  if (req.method !== "POST") return json({ status: "error", code: "method_not_allowed" }, 405);

  const { data: runtime, error: runtimeError } = await ctx.supabase
    .from("mobility_runtime_config")
    .select("routing_enabled")
    .eq("id", 1)
    .maybeSingle();

  if (runtimeError || !runtime?.routing_enabled) {
    if (runtimeError) console.error("mobility-resolve runtime config lookup failed", runtimeError);
    return json({ status: "disabled", code: "mobility_kill_switch" });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ status: "error", code: "invalid_json" }, 400); }

  const lat = finiteNumber(body.latitude);
  const lon = finiteNumber(body.longitude);
  const accuracy = finiteNumber(body.accuracy) ?? 25;
  const mode = body.mode === "venue" ? "venue" : "gps";

  if (lat == null || lon == null) return json({ status: "error", code: "invalid_coordinates" }, 400);

  const { data, error } = await ctx.supabase.rpc("mobility_resolve_local", {
    p_lat: lat,
    p_lon: lon,
    p_accuracy_m: accuracy,
    p_mode: mode,
  });

  if (error) {
    console.error("mobility-resolve rpc failed", error);
    return json({ status: "uncertain", code: "routing_config_unavailable" }, 503);
  }
  return json(data ?? { status: "uncertain", code: "empty_routing_result" });
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
        "access-control-allow-methods": "POST, OPTIONS",
      },
    });
  }
  return protectedHandler(req);
});
