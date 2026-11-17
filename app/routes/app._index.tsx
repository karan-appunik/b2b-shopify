import { useState, useMemo, useRef, useEffect } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { syncProductsToBackend } from "../services/productSync.server";
import { syncCustomersToBackend } from "../services/customerSync.server";
import { syncOrdersToBackend } from "../services/orderSync.server";
import { ensurePaymentOnAccountMetafieldDefinition } from "../services/customerCreditMetafield.server";

const CURRENT_COLOR = "#2563eb";
const PREVIOUS_COLOR = "#059669";

function formatMoney(value: number, currency = "USD") {
  const prefix = currency === "USD" ? "US$" : `${currency} `;
  return `${prefix}${Math.round(value || 0).toLocaleString("en-US")}`;
}

function niceStep(maxValue: number, tickCount: number) {
  const rawStep = maxValue / tickCount || 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;
  let niceResidual;
  if (residual > 5) niceResidual = 10;
  else if (residual > 2) niceResidual = 5;
  else if (residual > 1) niceResidual = 2;
  else niceResidual = 1;
  return niceResidual * magnitude;
}

function smoothPath(points: Array<{ x: number; y: number }>) {
  if (points.length < 2) return "";
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

function rangeLabel(startDateStr: string, endDateStr: string) {
  if (!startDateStr || !endDateStr) return "";
  const year = new Date(endDateStr + "T00:00:00").getFullYear();
  return `${formatDate(startDateStr)} – ${formatDate(endDateStr)} ${year}`;
}

async function getMerchantPanelSsoToken(shop: string): Promise<string | null> {
  const backendUrl = process.env.BACKEND_API_URL;
  const internalKey = process.env.BACKEND_INTERNAL_API_KEY;
  if (!backendUrl || !internalKey) return null;

  try {
    const res = await fetch(`${backendUrl.replace(/\/$/, "")}/api/internal/auth/sso`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-api-key": internalKey },
      body: JSON.stringify({ shop }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.token ?? null;
  } catch {
    return null;
  }
}

async function fetchActivityStats(shop: string, days: number = 7) {
  const backendUrl = process.env.BACKEND_API_URL || "http://localhost:5000";
  const internalKey = process.env.BACKEND_INTERNAL_API_KEY;
  if (!backendUrl || !internalKey) return null;

  try {
    const ssoRes = await fetch(`${backendUrl.replace(/\/$/, "")}/api/internal/auth/sso`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-api-key": internalKey },
      body: JSON.stringify({ shop }),
    });
    if (!ssoRes.ok) return null;
    const ssoData = await ssoRes.json();
    const token = ssoData.token;

    const statsRes = await fetch(`${backendUrl.replace(/\/$/, "")}/api/orders/stats?days=${days}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!statsRes.ok) return null;
    return await statsRes.json();
  } catch {
    return null;
  }
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  await ensurePaymentOnAccountMetafieldDefinition(admin);

  // Auto-sync products, customers and orders to backend
  await syncProductsToBackend(admin, session.shop);
  await syncCustomersToBackend(admin, session.shop);
  await syncOrdersToBackend(admin, session.shop);

  const merchantPanelUrl = process.env.MERCHANT_PANEL_URL || "";
  const ssoToken = merchantPanelUrl ? await getMerchantPanelSsoToken(session.shop) : null;
  const merchantPanelOpenUrl =
    merchantPanelUrl && ssoToken
      ? `${merchantPanelUrl.replace(/\/$/, "")}/sso?token=${encodeURIComponent(ssoToken)}`
      : merchantPanelUrl;

  const initialStats = await fetchActivityStats(session.shop, 7);

  return {
    shopDomain: session.shop,
    merchantPanelUrl,
    merchantPanelOpenUrl,
    initialStats,
  };
};

function DeltaBadge({ pct }: { pct: number }) {
  if (pct === 0) return <span style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af" }}>0%</span>;
  const up = pct > 0;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "2px",
        fontSize: "11px",
        fontWeight: 600,
        color: up ? "#059669" : "#dc2626",
      }}
    >
      <span style={{ fontSize: "12px", lineHeight: 1 }}>{up ? "↑" : "↓"}</span>
      {Math.abs(pct)}%
    </span>
  );
}

function StatCard({ label, value, pct }: { label: string; value: string | number; pct: number }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        backgroundColor: "#ffffff",
        padding: "10px 14px",
        minWidth: "130px",
        flex: "1 1 auto",
        maxWidth: "200px",
      }}
    >
      <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#6b7280", fontWeight: 500 }}>{label}</p>
      <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
        <span style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>{value}</span>
        <DeltaBadge pct={pct} />
      </div>
    </div>
  );
}

interface SeriesPoint {
  date: string;
  current: number;
  previous: number;
  previousDate?: string;
}

function LineChart({ series }: { series: SeriesPoint[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  // Drawn at the container's real width, so the chart is not scaled up (huge
  // labels, tall plot) when the page is wide.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(840);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setWidth(Math.max(320, Math.round(el.clientWidth)));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const height = 260;
  const padLeft = 60;
  const padRight = 20;
  const padTop = 16;
  const padBottom = 32;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const maxValue = Math.max(0, ...(series || []).flatMap((p) => [p.current, p.previous]));
  const tickCount = 4;
  const step = niceStep(maxValue || 2000, tickCount);
  const yMax = step * tickCount;
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => i * step);

  function x(i: number) {
    if (!series || series.length <= 1) return padLeft + plotWidth / 2;
    return padLeft + (i / (series.length - 1)) * plotWidth;
  }

  function y(val: number) {
    return padTop + plotHeight - (val / yMax) * plotHeight;
  }

  const currentPoints = (series || []).map((p, i) => ({ x: x(i), y: y(p.current) }));
  const previousPoints = (series || []).map((p, i) => ({ x: x(i), y: y(p.previous) }));
  const currentPath = smoothPath(currentPoints);
  const previousPath = smoothPath(previousPoints);

  const labelStep = Math.max(1, Math.ceil((series || []).length / 8));
  const hovered = hoverIndex != null && series ? series[hoverIndex] : null;

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * width;
    const ratio = Math.min(1, Math.max(0, (px - padLeft) / plotWidth));
    const idx = Math.round(ratio * ((series?.length || 1) - 1));
    setHoverIndex(Number.isFinite(idx) ? idx : null);
  }

  const previousRangeLabel =
    series && series.length > 0 && series[0].previousDate && series[series.length - 1].previousDate
      ? rangeLabel(series[0].previousDate!, series[series.length - 1].previousDate!)
      : "";
  const currentRangeLabel =
    series && series.length > 0 ? rangeLabel(series[0].date, series[series.length - 1].date) : "";

  return (
    <div style={{ marginTop: "16px", position: "relative" }}>
      <div ref={wrapRef} style={{ position: "relative" }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: "100%", height: "auto", display: "block", cursor: "crosshair" }}
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Horizontal grid lines and y-axis ticks */}
          {yTicks.map((t) => (
            <g key={t}>
              <line
                x1={padLeft}
                x2={width - padRight}
                y1={y(t)}
                y2={y(t)}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
              <text
                x={padLeft - 10}
                y={y(t)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize="11"
                fill="#9ca3af"
                fontFamily="inherit"
              >
                {t >= 1000 ? `US$${t / 1000}k` : `US$${t}`}
              </text>
            </g>
          ))}

          {/* X axis date labels */}
          {(series || []).map((p, i) =>
            i % labelStep === 0 ? (
              <text
                key={p.date}
                x={x(i)}
                y={height - 8}
                textAnchor="middle"
                fontSize="11"
                fill="#9ca3af"
                fontFamily="inherit"
              >
                {formatDate(p.date)}
              </text>
            ) : null
          )}

          {/* Curves */}
          <path
            d={previousPath}
            fill="none"
            stroke={PREVIOUS_COLOR}
            strokeWidth="2.2"
            strokeDasharray="6 5"
            strokeLinecap="round"
          />
          <path
            d={currentPath}
            fill="none"
            stroke={CURRENT_COLOR}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hover crosshair indicators */}
          {hovered && hoverIndex !== null && (
            <g>
              <line
                x1={x(hoverIndex)}
                x2={x(hoverIndex)}
                y1={padTop}
                y2={padTop + plotHeight}
                stroke="#cbd5e1"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle
                cx={x(hoverIndex)}
                cy={y(hovered.current)}
                r="4.5"
                fill={CURRENT_COLOR}
                stroke="#ffffff"
                strokeWidth="2"
              />
              <circle
                cx={x(hoverIndex)}
                cy={y(hovered.previous)}
                r="4.5"
                fill={PREVIOUS_COLOR}
                stroke="#ffffff"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Hover Tooltip Popup */}
        {hovered && hoverIndex !== null && (
          <div
            style={{
              position: "absolute",
              pointerEvents: "none",
              left: `${(x(hoverIndex) / width) * 100}%`,
              top: `${(Math.min(y(hovered.current), y(hovered.previous)) / height) * 100}%`,
              transform: "translate(-50%, -105%)",
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "8px 12px",
              boxShadow: "0 6px 16px rgba(0, 0, 0, 0.08)",
              fontSize: "12px",
              zIndex: 10,
              minWidth: "140px",
            }}
          >
            <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>Sales Performance</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "4px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "#64748b" }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: PREVIOUS_COLOR }} />
                {hovered.previousDate ? formatDate(hovered.previousDate) : "Prev"}
              </span>
              <strong style={{ color: "#334155" }}>{formatMoney(hovered.previous)}</strong>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "#64748b" }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: CURRENT_COLOR }} />
                {formatDate(hovered.date)}
              </span>
              <strong style={{ color: "#2563eb" }}>{formatMoney(hovered.current)}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Legend below chart */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
          marginTop: "12px",
          fontSize: "12px",
          color: "#4b5563",
          flexWrap: "wrap",
        }}
      >
        {previousRangeLabel && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: PREVIOUS_COLOR }} />
            {previousRangeLabel}
          </span>
        )}
        {currentRangeLabel && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: CURRENT_COLOR }} />
            {currentRangeLabel}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Index() {
  const {
    merchantPanelUrl,
    merchantPanelOpenUrl,
    initialStats,
  } = useLoaderData<typeof loader>();

  const [days, setDays] = useState(7);
  const [type, setType] = useState("all");
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(false);

  const handleDaysChange = async (newDays: number) => {
    setDays(newDays);
    setLoading(true);
    try {
      const res = await fetch(`/api/activity-stats?days=${newDays}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // Keep previous
    } finally {
      setLoading(false);
    }
  };

  const seriesWithPreviousDates = useMemo(() => {
    if (!stats?.series?.length) return [];
    return stats.series.map((point: any) => {
      const prevDate = new Date(new Date(point.date + "T00:00:00").getTime() - days * 24 * 60 * 60 * 1000);
      return { ...point, previousDate: prevDate.toISOString().slice(0, 10) };
    });
  }, [stats, days]);

  return (
    <s-page heading="Activity" inlineSize="large">
      {/* Grey backdrop so the white card stands out from the white admin page */}
      <div style={{ backgroundColor: "#f1f2f4", borderRadius: "16px", padding: "20px" }}>
      {/* Top Action Bar with Launch Merchant Panel */}
      {merchantPanelUrl && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
          <s-button
            href={merchantPanelOpenUrl || "#"}
            target="_blank"
            variant="secondary"
          >
            Open Dashboard
          </s-button>
        </div>
      )}

      {/* Main Activity Widget Card */}
      <div
        style={{
          border: "1px solid #c9cccf",
          borderRadius: "12px",
          backgroundColor: "#ffffff",
          padding: "24px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12)",
          marginBottom: "24px",
        }}
      >
        {/* Filters Row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "18px" }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <select
              value={days}
              onChange={(e) => handleDaysChange(Number(e.target.value))}
              style={{
                appearance: "none",
                WebkitAppearance: "none",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                backgroundColor: "#ffffff",
                padding: "7px 32px 7px 12px",
                fontSize: "13px",
                color: "#374151",
                cursor: "pointer",
                outline: "none",
                fontWeight: 500,
              }}
            >
              <option value={1}>Today</option>
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
            <span
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                fontSize: "10px",
                color: "#6b7280",
              }}
            >
              &#9662;
            </span>
          </div>

          <div style={{ position: "relative", display: "inline-block" }}>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{
                appearance: "none",
                WebkitAppearance: "none",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                backgroundColor: "#ffffff",
                padding: "7px 32px 7px 12px",
                fontSize: "13px",
                color: "#374151",
                cursor: "pointer",
                outline: "none",
                fontWeight: 500,
              }}
            >
              <option value="all">All Activity Types</option>
              <option value="orders">Orders</option>
            </select>
            <span
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                fontSize: "10px",
                color: "#6b7280",
              }}
            >
              &#9662;
            </span>
          </div>
        </div>

        {/* Stat Cards Row */}
        {loading || !stats ? (
          <p style={{ fontSize: "13px", color: "#9ca3af", padding: "20px 0" }}>Loading activity data…</p>
        ) : (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
              <StatCard
                label="Orders"
                value={stats.orders?.value ?? 0}
                pct={stats.orders?.changePct ?? 0}
              />
              <StatCard
                label="Total sales"
                value={formatMoney(stats.totalSales?.value ?? 0)}
                pct={stats.totalSales?.changePct ?? 0}
              />
              <StatCard
                label="Average order value"
                value={formatMoney(stats.averageOrderValue?.value ?? 0)}
                pct={stats.averageOrderValue?.changePct ?? 0}
              />
            </div>

            {/* Line Chart */}
            <LineChart series={seriesWithPreviousDates} />
          </>
        )}
      </div>
      </div>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
