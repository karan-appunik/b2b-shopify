import type { ActionFunctionArgs } from "react-router";
import { removeCustomerTags, type RemoveCustomerTagsInput } from "../services/customerTags.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const key = request.headers.get("x-internal-api-key");
  if (!key || key !== process.env.BACKEND_INTERNAL_API_KEY) {
    return new Response(JSON.stringify({ message: "Not authorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const input = (await request.json()) as RemoveCustomerTagsInput;
  const result = await removeCustomerTags(input);

  return new Response(JSON.stringify(result), {
    status: result.error ? 400 : 200,
    headers: { "Content-Type": "application/json" },
  });
};
