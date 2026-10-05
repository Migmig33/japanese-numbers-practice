/**
 * Sennin visitor counter.
 *
 * Counts one visit per browser per UTC day. The browser sends only a random id it made
 * up for itself; nothing identifying is stored, and IP addresses are never written down.
 *
 *   GET  /count  -> { total, today }
 *   POST /visit  -> { total, today }   body: { "id": "<random id>" }
 *
 * KV layout:
 *   total           running total of daily-unique visits
 *   day:<date>      that day's unique visits
 *   seen:<date>:<id>  marker so one browser counts once a day (expires after 2 days)
 */

const SEEN_TTL_SECONDS = 60 * 60 * 48;
const ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

const today = () => new Date().toISOString().slice(0, 10);

function corsHeaders(request, env) {
  const allowed = env.ALLOWED_ORIGIN || "*";
  const origin = request.headers.get("Origin") || "";
  // With a specific ALLOWED_ORIGIN, echo it back only when it matches.
  const value = allowed === "*" ? "*" : allowed === origin ? origin : "";
  return {
    "Access-Control-Allow-Origin": value,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

const json = (body, request, env, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...corsHeaders(request, env) },
  });

const num = async (kv, key) => {
  const raw = await kv.get(key);
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    const day = today();

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request, env) });

    if (pathname === "/count" && request.method === "GET") {
      const [total, todayCount] = await Promise.all([num(env.VISITS, "total"), num(env.VISITS, `day:${day}`)]);
      return json({ total, today: todayCount }, request, env);
    }

    if (pathname === "/visit" && request.method === "POST") {
      let id;
      try {
        ({ id } = await request.json());
      } catch {
        return json({ error: "expected JSON body" }, request, env, 400);
      }
      if (typeof id !== "string" || !ID_PATTERN.test(id)) {
        return json({ error: "invalid id" }, request, env, 400);
      }

      const seenKey = `seen:${day}:${id}`;
      if (await env.VISITS.get(seenKey)) {
        // Already counted today — revisits, reloads and back-navigation add nothing.
        const [total, todayCount] = await Promise.all([num(env.VISITS, "total"), num(env.VISITS, `day:${day}`)]);
        return json({ total, today: todayCount, counted: false }, request, env);
      }

      await env.VISITS.put(seenKey, "1", { expirationTtl: SEEN_TTL_SECONDS });
      const [total, todayCount] = await Promise.all([num(env.VISITS, "total"), num(env.VISITS, `day:${day}`)]);
      const nextTotal = total + 1;
      const nextToday = todayCount + 1;
      await Promise.all([
        env.VISITS.put("total", String(nextTotal)),
        // Daily tallies are kept for a year, then expire on their own.
        env.VISITS.put(`day:${day}`, String(nextToday), { expirationTtl: 60 * 60 * 24 * 365 }),
      ]);
      return json({ total: nextTotal, today: nextToday, counted: true }, request, env);
    }

    return json({ error: "not found" }, request, env, 404);
  },
};
