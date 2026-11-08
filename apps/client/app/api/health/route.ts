/**
 * Health check for uptime monitors such as Better Stack. It answers without
 * rendering a page or calling another service, so frequent checks cost next
 * to nothing while still proving the app's server is up.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

const HEADERS = { "Cache-Control": "no-store" };

export function GET() {
  return Response.json({ status: "ok" }, { headers: HEADERS });
}

export function HEAD() {
  return new Response(null, { headers: HEADERS });
}
