import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";
import { createSharedWorkspaceRequestHandler } from "./sharedWorkspacePlugin.js";

const DEFAULT_PORT = 4173;
const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT) || DEFAULT_PORT;
const DIST_DIR = resolve(process.env.TIMETRACKR_DIST_DIR || join(process.cwd(), "dist"));

const CONTENT_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp"
};

function sendText(response, statusCode, text) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "text/plain; charset=utf-8");
  response.end(text);
}

function resolveDistPath(pathname) {
  const normalizedPathname = decodeURIComponent(pathname).replace(/^\/+/, "");
  const candidatePath = resolve(DIST_DIR, normalizedPathname || "index.html");
  const allowedPrefix = DIST_DIR.endsWith(sep) ? DIST_DIR : `${DIST_DIR}${sep}`;

  if (candidatePath !== DIST_DIR && !candidatePath.startsWith(allowedPrefix)) {
    return null;
  }

  return candidatePath;
}

async function fileExists(pathname) {
  try {
    const stats = await stat(pathname);
    return stats.isFile();
  } catch {
    return false;
  }
}

async function serveStatic(request, response) {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  let filePath = resolveDistPath(pathname);

  if (!filePath) {
    sendText(response, 403, "Forbidden.");
    return;
  }

  if (!(await fileExists(filePath))) {
    filePath = resolveDistPath("/index.html");
  }

  if (!filePath || !(await fileExists(filePath))) {
    sendText(response, 404, "Build output not found. Run npm run build first.");
    return;
  }

  response.statusCode = 200;
  response.setHeader("Content-Type", CONTENT_TYPES[extname(filePath)] || "application/octet-stream");
  response.setHeader("X-Content-Type-Options", "nosniff");
  createReadStream(filePath).pipe(response);
}

const handleWorkspaceRequest = createSharedWorkspaceRequestHandler();

const server = createServer(async (request, response) => {
  try {
    if (await handleWorkspaceRequest(request, response)) {
      return;
    }

    await serveStatic(request, response);
  } catch (error) {
    sendText(response, 500, error.message || "Server error.");
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Creative Operations server listening at http://${HOST}:${PORT}`);
  console.log(`Workspace database: ${process.env.TIMETRACKR_WORKSPACE_DB || "default .workspace-data/workspace.sqlite"}`);
});
