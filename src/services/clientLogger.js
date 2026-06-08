const SENSITIVE_KEY_PATTERN = /(password|token|secret|email|pin|name|note|description)/i;
const MAX_CLIENT_EVENTS = 100;
const TELEMETRY_ENDPOINT = import.meta.env?.VITE_TELEMETRY_ENDPOINT || "";
const clientEventBuffer = [];

function shouldIncludeDeveloperDetails() {
  return Boolean(import.meta.env?.DEV);
}

export function sanitizeLogContext(context = {}) {
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key) ? "[redacted]" : value
    ])
  );
}

export function createClientLogRecord(eventName, error, context = {}) {
  const record = {
    eventName,
    message: error?.message || "Unknown error",
    context: sanitizeLogContext(context),
    timestamp: new Date().toISOString()
  };

  if (shouldIncludeDeveloperDetails() && error?.stack) {
    record.stack = error.stack;
  }

  return record;
}

export function createTelemetryEnvelope(kind, payload) {
  return {
    app: "creative-operations",
    schemaVersion: 1,
    kind,
    payload
  };
}

export function sendTelemetryEnvelope(
  envelope,
  {
    endpoint = TELEMETRY_ENDPOINT,
    navigatorTarget = globalThis.navigator,
    fetchTarget = globalThis.fetch
  } = {}
) {
  if (!endpoint) {
    return false;
  }

  const body = JSON.stringify(envelope);

  if (navigatorTarget?.sendBeacon) {
    const beaconBody = typeof Blob === "undefined"
      ? body
      : new Blob([body], { type: "application/json" });
    return navigatorTarget.sendBeacon(endpoint, beaconBody);
  }

  if (typeof fetchTarget === "function") {
    fetchTarget(endpoint, {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      keepalive: true
    }).catch(() => {});
    return true;
  }

  return false;
}

export function logClientError(eventName, error, context = {}) {
  const record = createClientLogRecord(eventName, error, context);
  console.error("[client-error]", record);
  sendTelemetryEnvelope(createTelemetryEnvelope("error", record));
}

export function trackClientEvent(eventName, context = {}) {
  const event = {
    eventName,
    context: sanitizeLogContext(context),
    timestamp: new Date().toISOString()
  };

  clientEventBuffer.unshift(event);
  clientEventBuffer.length = Math.min(clientEventBuffer.length, MAX_CLIENT_EVENTS);

  if (shouldIncludeDeveloperDetails()) {
    console.info("[client-event]", event);
  }

  sendTelemetryEnvelope(createTelemetryEnvelope("event", event));

  return event;
}

export function getClientEvents() {
  return [...clientEventBuffer];
}

export function clearClientEvents() {
  clientEventBuffer.length = 0;
}

export function registerGlobalErrorHandlers(windowTarget = globalThis.window) {
  if (!windowTarget?.addEventListener || !windowTarget?.removeEventListener) {
    return () => {};
  }

  const handleError = (event) => {
    logClientError("global_error", event.error || new Error(event.message || "Global error"), {
      filename: event.filename,
      lineNumber: event.lineno,
      columnNumber: event.colno
    });
  };

  const handleUnhandledRejection = (event) => {
    const reason = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason || "Unhandled promise rejection"));
    logClientError("unhandled_rejection", reason);
  };

  windowTarget.addEventListener("error", handleError);
  windowTarget.addEventListener("unhandledrejection", handleUnhandledRejection);

  return () => {
    windowTarget.removeEventListener("error", handleError);
    windowTarget.removeEventListener("unhandledrejection", handleUnhandledRejection);
  };
}
