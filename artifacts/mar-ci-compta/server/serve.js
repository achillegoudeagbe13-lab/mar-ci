/**
 * Standalone production server for Expo static builds.
 *
 * Serves the output of build.js (static-build/) with two special routes:
 * - GET / or /manifest with expo-platform header → platform manifest JSON
 * - GET / without expo-platform → landing page HTML
 * Everything else falls through to static file serving from ./static-build/.
 *
 * Zero external dependencies — uses only Node.js built-ins (http, fs, path).
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const STATIC_ROOT = path.resolve(__dirname, "..", "static-build");
const WEB_ROOT = path.resolve(__dirname, "..", "static-build", "web");
const PUBLIC_ROOT = path.resolve(__dirname, "..", "public");
const TEMPLATE_PATH = path.resolve(__dirname, "templates", "landing-page.html");
const basePath = (process.env.BASE_PATH || "/").replace(/\/+$/, "");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".map": "application/json",
};

function getAppName() {
  try {
    const appJsonPath = path.resolve(__dirname, "..", "app.json");
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf-8"));
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}

function serveManifest(platform, res) {
  const manifestPath = path.join(STATIC_ROOT, platform, "manifest.json");

  if (!fs.existsSync(manifestPath)) {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(
      JSON.stringify({ error: `Manifest not found for platform: ${platform}` }),
    );
    return;
  }

  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.writeHead(200, {
    "content-type": "application/json",
    "expo-protocol-version": "1",
    "expo-sfv-version": "0",
  });
  res.end(manifest);
}

function serveWebApp(req, res) {
  // Try requested path first, then fallback to index.html (SPA routing)
  const safePath = path.normalize(req._parsedPath || "/").replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = path.join(WEB_ROOT, safePath);

  const tryFile = (fp) =>
    fs.existsSync(fp) && !fs.statSync(fp).isDirectory() ? fp : null;

  const resolved =
    tryFile(filePath) ||
    tryFile(path.join(WEB_ROOT, safePath, "index.html")) ||
    tryFile(path.join(WEB_ROOT, "index.html"));

  if (!resolved) {
    res.writeHead(404);
    res.end("Not Found");
    return;
  }

  const ext = path.extname(resolved).toLowerCase();
  const contentType = MIME_TYPES[ext] || "text/html; charset=utf-8";
  res.writeHead(200, { "content-type": contentType });
  res.end(fs.readFileSync(resolved));
}

function serveLandingPage(req, res, landingPageTemplate, appName) {
  // If web build exists, serve it directly instead of the Expo Go page
  const webIndex = path.join(WEB_ROOT, "index.html");
  if (fs.existsSync(webIndex)) {
    req._parsedPath = "/";
    return serveWebApp(req, res);
  }

  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = forwardedProto || "https";
  const host = req.headers["x-forwarded-host"] || req.headers["host"];
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;

  const html = landingPageTemplate
    .replace(/BASE_URL_PLACEHOLDER/g, baseUrl)
    .replace(/EXPS_URL_PLACEHOLDER/g, expsUrl)
    .replace(/APP_NAME_PLACEHOLDER/g, appName);

  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(html);
}

function serveStaticFile(urlPath, res) {
  const safePath = path.normalize(urlPath).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = path.join(STATIC_ROOT, safePath);
  const publicFilePath = path.join(PUBLIC_ROOT, safePath);

  if (!filePath.startsWith(STATIC_ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  const resolvedPath = fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()
    ? filePath
    : fs.existsSync(publicFilePath) && !fs.statSync(publicFilePath).isDirectory()
    ? publicFilePath
    : null;

  if (!resolvedPath) {
    res.writeHead(404);
    res.end("Not Found");
    return;
  }

  const ext = path.extname(resolvedPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const content = fs.readFileSync(resolvedPath);
  res.writeHead(200, { "content-type": contentType });
  res.end(content);
}

const landingPageTemplate = fs.readFileSync(TEMPLATE_PATH, "utf-8");
const appName = getAppName();

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  let pathname = url.pathname;

  if (basePath && pathname.startsWith(basePath)) {
    pathname = pathname.slice(basePath.length) || "/";
  }

  req._parsedPath = pathname;

  const platform = req.headers["expo-platform"];

  // Expo Go native requests → serve mobile manifest
  if ((pathname === "/" || pathname === "/manifest") && (platform === "ios" || platform === "android")) {
    return serveManifest(platform, res);
  }

  // Root → serve web app (PWA) or landing page
  if (pathname === "/") {
    return serveLandingPage(req, res, landingPageTemplate, appName);
  }

  // Try web build files first, then fall back to mobile static files
  const webFilePath = path.join(WEB_ROOT, pathname);
  if (fs.existsSync(webFilePath) && !fs.statSync(webFilePath).isDirectory()) {
    return serveWebApp(req, res);
  }

  serveStaticFile(pathname, res);
});

const port = parseInt(process.env.PORT || "3000", 10);
server.listen(port, "0.0.0.0", () => {
  console.log(`Serving static Expo build on port ${port}`);
});
