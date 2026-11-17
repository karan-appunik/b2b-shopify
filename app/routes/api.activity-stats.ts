import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const days = Number(url.searchParams.get("days")) || 7;

  const backendUrl = process.env.BACKEND_API_URL || "http://localhost:5000";
  const internalKey = process.env.BACKEND_INTERNAL_API_KEY;

  try {
    const ssoRes = await fetch(`${backendUrl.replace(/\/$/, "")}/api/internal/auth/sso`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-api-key": internalKey || "" },
      body: JSON.stringify({ shop: session.shop }),
    });
    if (!ssoRes.ok) {
      return Response.json({ error: "SSO failed" }, { status: 401 });
    }
    const ssoData = await ssoRes.json();
    const token = ssoData.token;

    const statsRes = await fetch(`${backendUrl.replace(/\/$/, "")}/api/orders/stats?days=${days}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!statsRes.ok) {
      return Response.json({ error: "Stats fetch failed" }, { status: statsRes.status });
    }
    const stats = await statsRes.json();
    return Response.json(stats);
  } catch (err: any) {
    return Response.json({ error: err?.message || "Internal error" }, { status: 500 });
  }
};

