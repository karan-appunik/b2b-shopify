function getBackendConfig(): { backendUrl: string; internalKey: string } | null {
  // eslint-disable-next-line no-undef
  const backendUrl = process.env.BACKEND_API_URL;
  // eslint-disable-next-line no-undef
  const internalKey = process.env.BACKEND_INTERNAL_API_KEY;

  if (!backendUrl || !internalKey) {
    console.error("[idempotency] BACKEND_API_URL or BACKEND_INTERNAL_API_KEY not set");
    return null;
  }

  return { backendUrl, internalKey };
}

export interface IdempotencyClaim {
  shop: string;
  scope: string;
  key: string;
}

export type BeginResult =
  | { state: "new" }
  | { state: "in_progress" }
  | { state: "conflict" }
  | { state: "replay"; response: { status: number; body: unknown } };

async function post(path: string, body: unknown): Promise<Response | null> {
  const config = getBackendConfig();
  if (!config) return null;

  try {
    return await fetch(`${config.backendUrl}/api/internal/idempotency/${path}`, {
      method: "POST",
      headers: { "x-internal-api-key": config.internalKey, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error(`[idempotency] ${path} failed`, err);
    return null;
  }
}

// Claims a key before doing work whose effect must not be repeated (placing
// an order). Returns null when the store can't be reached, so the caller can
// decide whether to carry on without protection.
export async function beginOperation(claim: IdempotencyClaim, request: unknown): Promise<BeginResult | null> {
  const res = await post("begin", { ...claim, request });
  if (!res || !res.ok) return null;
  return (await res.json()) as BeginResult;
}

export async function completeOperation(
  claim: IdempotencyClaim,
  response: { status: number; body: unknown },
): Promise<void> {
  await post("complete", { ...claim, response });
}

// The attempt failed — free the key so a retry can run the work again.
export async function releaseOperation(claim: IdempotencyClaim): Promise<void> {
  await post("release", claim);
}
