import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { resolvePaymentLink } from "../services/agentContext.server";

// The page behind the link in the buyer's email. Only the customer the link
// was made for can use it: Shopify tells us who is signed in, and the backend
// checks that against the link. Everyone else sees the same "not available"
// message whether the link exists or not.

const page = (title: string, message: string, extra = "", status = 200) =>
  new Response(
    `<div style="max-width:520px;margin:64px auto;padding:0 16px;font-family:inherit;text-align:center">
       <h2 style="margin:0 0 12px">${title}</h2>
       <p style="margin:0 0 20px;color:#555">${message}</p>
       ${extra}
     </div>`,
    { status, headers: { "Content-Type": "application/liquid" } },
  );

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  try {
    const { session } = await authenticate.public.appProxy(request);
    const loggedInCustomerId = new URL(request.url).searchParams.get("logged_in_customer_id");
    const token = params.token || "";

    if (!session) return page("Link not available", "This payment link isn't available.", "", 404);

    if (!loggedInCustomerId) {
      const back = encodeURIComponent(`/apps/sparklayer/pay/${token}`);
      return page(
        "Sign in to pay",
        "Please sign in to your account to continue to secure payment.",
        `<a href="/account/login?return_url=${back}" style="display:inline-block;padding:10px 20px;background:#111;color:#fff;border-radius:6px;text-decoration:none">Sign in</a>`,
      );
    }

    const result = await resolvePaymentLink(session.shop, loggedInCustomerId, token);

    if (result.status === 200 && result.body?.invoiceUrl) {
      const url = String(result.body.invoiceUrl);
      // The address goes into the script as a JSON string, with "<" escaped
      // so it can't close the tag.
      const scriptUrl = JSON.stringify(url).split("<").join("\\u003c");
      return page(
        "Taking you to secure payment…",
        "You'll be sent to our hosted checkout page.",
        `<a href="${url.split('"').join("%22")}" style="color:#111">Continue</a>
         <script>window.location.replace(${scriptUrl});</script>`,
      );
    }

    if (result.status === 409) return page("Already paid", "This order has already been paid. Thank you!");
    if (result.status === 410) {
      return page("Link expired", "This payment link is no longer valid. Please ask your sales contact to send a new one.", "", 410);
    }

    return page("Link not available", "This payment link isn't available for this account.", "", 404);
  } catch (error) {
    console.error("pay proxy error:", error);
    return page("Something went wrong", "Please try again in a moment.", "", 500);
  }
};
