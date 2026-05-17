const SENSITIVE_KEY_PATTERN = /(password|token|secret|email|pin|name|note|description)/i;

export function sanitizeLogContext(context = {}) {
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key) ? "[redacted]" : value
    ])
  );
}

export function logClientError(eventName, error, context = {}) {
  console.error("[client-error]", {
    eventName,
    message: error?.message || "Unknown error",
    stack: error?.stack,
    context: sanitizeLogContext(context)
  });
}
