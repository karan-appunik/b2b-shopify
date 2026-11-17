import "dotenv/config";
import fetch from "node-fetch";

const token = process.env.DEBUG_SHOPIFY_ACCESS_TOKEN;
const shop = process.env.DEBUG_SHOPIFY_SHOP;

if (!token || !shop) {
  throw new Error(
    "Missing DEBUG_SHOPIFY_ACCESS_TOKEN or DEBUG_SHOPIFY_SHOP in .env",
  );
}

const query = `
  query {
    __type(name: "Catalog") {
      name
      fields {
        name
        type {
          name
          kind
          ofType {
            name
            kind
          }
        }
      }
    }
  }
`;

async function run() {
  const response = await fetch(`https://${shop}/admin/api/2024-04/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query }),
  });
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

run();
