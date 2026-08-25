import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { deleteProductsByShopifyProductId } from "../services/productSync.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  const productId = (payload as { id: number | string }).id;
  await deleteProductsByShopifyProductId(productId, shop);

  return new Response();
};
