import { findFeatureAt } from "../../../lib/geo";

export const runtime = "nodejs" as const;

export async function GET(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const latStr = url.searchParams.get("lat");
    const lonStr = url.searchParams.get("lon");

    if (latStr == null || lonStr == null) {
      return new Response(JSON.stringify({ error: "Missing lat and lon query params" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const lat = Number(latStr);
    const lon = Number(lonStr);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return new Response(JSON.stringify({ error: "Invalid lat/lon values" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const baseUrl = url.origin;
    const feature = await findFeatureAt(lat, lon, baseUrl);
    if (!feature) {
      return new Response(JSON.stringify({ error: "No zoning polygon found for coordinate" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }

    // Return the raw GeoJSON Feature
    return new Response(JSON.stringify(feature), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

