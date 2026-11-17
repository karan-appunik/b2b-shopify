function getBackendConfig(): { backendUrl: string; internalKey: string } | null {
  // eslint-disable-next-line no-undef
  const backendUrl = process.env.BACKEND_API_URL;
  // eslint-disable-next-line no-undef
  const internalKey = process.env.BACKEND_INTERNAL_API_KEY;

  if (!backendUrl || !internalKey) {
    console.error("[formsProxy] BACKEND_API_URL or BACKEND_INTERNAL_API_KEY not set");
    return null;
  }

  return { backendUrl, internalKey };
}

export interface PublicFormField {
  _id: string;
  label: string;
  type: string;
  placeholder?: string;
  required: boolean;
  options: string[];
  fileOptions?: {
    maxFileSizeMB: number;
    allowedFileTypes: string;
    expiryDays: number | null;
    allowMultiple: boolean;
  };
}

export interface PublicForm {
  _id: string;
  name: string;
  fields: PublicFormField[];
  settings: { submitButtonText: string; successMessage: string; enableApprovalWorkflow: boolean };
}

// Fetches a published form's schema for the storefront to render — never
// exposes draft forms, since the backend only matches status: "published".
export async function getPublicForm(shop: string, formId: string): Promise<PublicForm | null> {
  const config = getBackendConfig();
  if (!config) return null;

  try {
    const res = await fetch(
      `${config.backendUrl}/api/internal/forms/${formId}/public?shop=${encodeURIComponent(shop)}`,
      { headers: { "x-internal-api-key": config.internalKey } },
    );

    if (!res.ok) return null;
    return (await res.json()) as PublicForm;
  } catch (err) {
    console.error("[formsProxy] failed to fetch public form", err);
    return null;
  }
}

// Forwards a "file" field's selected file to backend-api's own upload
// endpoint — a separate multipart request from the main JSON submit (see
// apps.sparklayer.forms.$id.upload.tsx), since the submit body is JSON.
export async function uploadFormFile(
  shop: string,
  formId: string,
  fieldId: string,
  file: File,
): Promise<{ ok: true; url: string } | { ok: false; status: number; error: string }> {
  const config = getBackendConfig();
  if (!config) return { ok: false, status: 500, error: "Backend is not configured" };

  try {
    const body = new FormData();
    body.append("fieldId", fieldId);
    body.append("file", file, file.name);

    const res = await fetch(
      `${config.backendUrl}/api/internal/forms/${formId}/upload?shop=${encodeURIComponent(shop)}`,
      { method: "POST", headers: { "x-internal-api-key": config.internalKey }, body },
    );

    const responseBody = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { ok: false, status: res.status, error: responseBody.message || "Upload failed" };
    }

    return { ok: true, url: responseBody.url };
  } catch (err) {
    console.error("[formsProxy] failed to upload form file", err);
    return { ok: false, status: 500, error: "Could not upload file" };
  }
}

export async function submitFormEntry(
  shop: string,
  formId: string,
  data: Record<string, unknown>,
): Promise<{ ok: true; successMessage: string } | { ok: false; error: string }> {
  const config = getBackendConfig();
  if (!config) return { ok: false, error: "Backend is not configured" };

  try {
    const res = await fetch(`${config.backendUrl}/api/internal/forms/${formId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-api-key": config.internalKey },
      body: JSON.stringify({ shop, data }),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { ok: false, error: body.message || "Could not submit form" };
    }

    return { ok: true, successMessage: body.successMessage };
  } catch (err) {
    console.error("[formsProxy] failed to submit form entry", err);
    return { ok: false, error: "Could not submit form" };
  }
}
