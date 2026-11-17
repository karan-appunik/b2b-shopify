import type { ActionFunctionArgs } from "react-router";
import { pushPriceListToShopify, type PushPriceListInput } from "../services/priceListPush.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const key = request.headers.get("x-internal-api-key");
  if (!key || key !== process.env.BACKEND_INTERNAL_API_KEY) {
    return new Response(JSON.stringify({ message: "Not authorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const input = (await request.json()) as PushPriceListInput;
  const result = await pushPriceListToShopify(input);

  return new Response(JSON.stringify(result), {
    status: result.error ? 400 : 200,
    headers: { "Content-Type": "application/json" },
  });
};
