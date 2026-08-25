import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { deleteCustomerByShopifyCustomerId } from "../services/customerSync.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  const customerId = (payload as { id: number | string }).id;
  await deleteCustomerByShopifyCustomerId(`gid://shopify/Customer/${customerId}`, shop);

  return new Response();
};
