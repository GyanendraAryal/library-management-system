export class ApiError extends Error {
  status?: number;
  fields: Record<string, string>;

  constructor(message: string, status?: number, fields: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
  }
}

function flatten(value: unknown): string[] {
  if (value == null) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(flatten);
  if (typeof value === "object") {
    return Object.values(value).flatMap(flatten);
  }
  return [String(value)];
}

function fieldMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: Record<string, string> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const messages = flatten(nested);
    if (messages.length) result[key] = messages.join(" ");
  }
  return result;
}

export function parseApiError(data: unknown, status?: number): ApiError {
  if (typeof data === "string") {
    return new ApiError(data, status);
  }

  if (data && typeof data === "object") {
    const body = data as Record<string, unknown>;
    const wrapped = body.error;
    const fields =
      wrapped && typeof wrapped === "object"
        ? fieldMap(wrapped)
        : fieldMap(body);

    const fromFields = Object.values(fields)[0];
    const messageCandidate = [body.message, body.detail, wrapped].find(
      (item) => typeof item === "string" && item.length > 0,
    ) as string | undefined;

    return new ApiError(
      messageCandidate || fromFields || `Request failed with status ${status ?? "unknown"}`,
      status,
      fields,
    );
  }

  return new ApiError(`Request failed with status ${status ?? "unknown"}`, status);
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
