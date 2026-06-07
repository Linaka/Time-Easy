import test from "node:test";
import assert from "node:assert/strict";
import {
  clearClientEvents,
  createClientLogRecord,
  createTelemetryEnvelope,
  getClientEvents,
  registerGlobalErrorHandlers,
  sanitizeLogContext,
  sendTelemetryEnvelope,
  trackClientEvent
} from "../src/services/clientLogger.js";

test("redacts sensitive fields from client log context", () => {
  assert.deepEqual(
    sanitizeLogContext({
      activeSection: "Reports",
      email: "ava@example.com",
      token: "secret-token",
      description: "Client task"
    }),
    {
      activeSection: "Reports",
      email: "[redacted]",
      token: "[redacted]",
      description: "[redacted]"
    }
  );
});

test("client log records omit stack traces outside developer builds", () => {
  const record = createClientLogRecord("global_error", new Error("Boom"), {
    email: "ava@example.com",
    section: "Reports"
  });

  assert.equal(record.message, "Boom");
  assert.equal(record.stack, undefined);
  assert.match(record.timestamp, /^\d{4}-\d{2}-\d{2}T/);
  assert.deepEqual(record.context, {
    email: "[redacted]",
    section: "Reports"
  });
});

test("client event buffer redacts sensitive context", () => {
  clearClientEvents();

  trackClientEvent("navigation", {
    section: "Reports",
    description: "Secret project task"
  });

  assert.deepEqual(getClientEvents().map((event) => event.context), [
    {
      section: "Reports",
      description: "[redacted]"
    }
  ]);
});

test("global error handler registers and unregisters listeners", () => {
  const listeners = [];
  const fakeWindow = {
    addEventListener(type, handler) {
      listeners.push({ type, handler });
    },
    removeEventListener(type, handler) {
      const index = listeners.findIndex(
        (listener) => listener.type === type && listener.handler === handler
      );
      if (index >= 0) {
        listeners.splice(index, 1);
      }
    }
  };

  const unregister = registerGlobalErrorHandlers(fakeWindow);
  assert.deepEqual(listeners.map((listener) => listener.type), ["error", "unhandledrejection"]);

  unregister();
  assert.equal(listeners.length, 0);
});

test("telemetry envelopes can be delivered through sendBeacon", () => {
  const sent = [];
  const envelope = createTelemetryEnvelope("event", { eventName: "navigation" });
  const delivered = sendTelemetryEnvelope(envelope, {
    endpoint: "/telemetry",
    navigatorTarget: {
      sendBeacon(url, body) {
        sent.push({ url, body });
        return true;
      }
    },
    fetchTarget: null
  });

  assert.equal(delivered, true);
  assert.equal(sent[0].url, "/telemetry");
  assert.ok(sent[0].body);
});
