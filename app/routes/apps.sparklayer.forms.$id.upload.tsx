import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { uploadFormFile } from "../services/formsProxy.server";

// Storefront uploads a "file" field's selected file here — a separate
// multipart request from the main JSON submit (see apps.sparklayer.forms.$id.tsx).
export const action = async ({ request, params }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ message: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { session } = await authenticate.public.appProxy(request);

    if (!session || !params.id) {
      return new Response(JSON.stringify({ message: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const fieldId = formData.get("fieldId");

    if (!(file instanceof File) || typeof fieldId !== "string" || !fieldId) {
      return new Response(JSON.stringify({ message: "No file uploaded, or file type not allowed" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await uploadFormFile(session.shop, params.id, fieldId, file);

    if (!result.ok) {
      return new Response(JSON.stringify({ message: result.error }), {
        status: result.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ url: result.url }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("forms proxy upload action error:", error);
    return new Response(JSON.stringify({ message: error.message || String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
