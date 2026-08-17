import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CUSTOMERS_QUERY = `
  query SyncCustomers($cursor: String) {
    customers(first: 100, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          firstName
          lastName
          email
          defaultAddress {
            company
          }
        }
      }
    }
  }
`;

async function debugSync() {
  try {
    const session = await prisma.session.findFirst();
    if (!session) {
      console.log("No session found in Prisma!");
      return;
    }

    const { shop, accessToken } = session;
    console.log(`Using active session for shop: ${shop}`);
    console.log(`Access Token: ${accessToken}`);

    console.log("Querying Shopify GraphQL Admin API...");
    const res = await fetch(`https://${shop}/admin/api/2026-10/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({
        query: CUSTOMERS_QUERY,
      }),
    });

    console.log("Response Status:", res.status);
    const body = await res.json();
    if (body.errors) {
      console.error("GraphQL Errors:", JSON.stringify(body.errors, null, 2));
      return;
    }

    const customers = body.data.customers.edges;
    console.log(`Successfully fetched ${customers.length} customers!`);
    console.log("Customers data:", JSON.stringify(body.data, null, 2));

  } catch (err) {
    console.error("Debug sync error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

debugSync();
