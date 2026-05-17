import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeLogContext } from "../src/services/clientLogger.js";

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
