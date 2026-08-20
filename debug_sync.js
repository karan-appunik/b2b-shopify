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
    const sessions = await prisma.session.findMany();
    console.log("All sessions in database:");
    console.log(sessions);
  } catch (err) {
    console.error("Debug sync error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

debugSync();
