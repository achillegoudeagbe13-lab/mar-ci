/**
 * static.ts — Sert le build Expo (PWA web + manifests mobile OTA)
 *
 * Monté dans app.ts APRÈS les routes /api. Activé seulement si STATIC_ROOT
 * est défini (production combinée). En dev local, cette variable est absente
 * et le middleware est ignoré — rien ne change pour le workflow Replit.
 *
 * Routes gérées :
 *   GET /           + header expo-platform: ios|android → manifest JSON
 *   GET /manifest   + header expo-platform: ios|android → manifest JSON
 *   GET /*          → fichiers statiques du PWA (static-build/web/)
 *                     avec fallback SPA sur index.html
 */

import fs from "fs";
import path from "path";
import { type Express } from "express";

const MIME: Record<string, string> = {
  ".html":  "text/html; charset=utf-8",
  ".js":    "application/javascript; charset=utf-8",
  ".json":  "application/json; charset=utf-8",
  ".css":   "text/css; charset=utf-8",
  ".png":   "image/png",
  ".jpg":   "image/jpeg",
  ".jpeg":  "image/jpeg",
  ".gif":   "image/gif",
  ".svg":   "image/svg+xml",
  ".ico":   "image/x-icon",
  ".woff":  "font/woff",
  ".woff2": "font/woff2",
  ".ttf":   "font/ttf",
  ".otf":   "font/otf",
  ".webp":  "image/webp",
};

function tryFile(p: string): string | null {
  try {
    return fs.statSync(p).isFile() ? p : null;
  } catch {
    return null;
  }
}

export function mountStaticExpo(app: Express): void {
  const staticRoot = process.env["STATIC_ROOT"];
  if (!staticRoot) return; // dev local — on n'active pas le middleware

  const absRoot = path.resolve(staticRoot);
  const webRoot  = path.join(absRoot, "web");

  app.use((req, res, next) => {
    const platform = req.headers["expo-platform"] as string | undefined;
    const rawPath  = req.path;

    // ── Expo Go : manifest iOS / Android ────────────────────────────────────
    if (platform === "ios" || platform === "android") {
      if (rawPath === "/" || rawPath === "/manifest") {
        const manifestPath = path.join(absRoot, platform, "manifest.json");
        if (!fs.existsSync(manifestPath)) {
          res.status(404).json({ error: `Manifest introuvable : ${platform}` });
          return;
        }
        res.set({
          "content-type":         "application/json",
          "expo-protocol-version": "1",
          "expo-sfv-version":      "0",
        });
        res.send(fs.readFileSync(manifestPath));
        return;
      }
    }

    // ── Fichiers statiques (PWA + assets mobile) ─────────────────────────
    const safePath = path.normalize(rawPath).replace(/^(\.\.(\/|\\|$))+/, "");

    // 1. Chercher dans web/
    const webFile =
      tryFile(path.join(webRoot, safePath)) ||
      tryFile(path.join(webRoot, safePath, "index.html"));

    if (webFile) {
      const ct = MIME[path.extname(webFile).toLowerCase()] ?? "application/octet-stream";
      res.set("content-type", ct);
      res.send(fs.readFileSync(webFile));
      return;
    }

    // 2. Chercher dans static-build/ (assets mobile OTA)
    const mobileFile = tryFile(path.join(absRoot, safePath));
    if (mobileFile && mobileFile.startsWith(absRoot)) {
      const ct = MIME[path.extname(mobileFile).toLowerCase()] ?? "application/octet-stream";
      res.set("content-type", ct);
      res.send(fs.readFileSync(mobileFile));
      return;
    }

    // 3. SPA fallback → index.html du PWA
    const indexHtml = path.join(webRoot, "index.html");
    if (fs.existsSync(indexHtml)) {
      res.set("content-type", "text/html; charset=utf-8");
      res.send(fs.readFileSync(indexHtml));
      return;
    }

    next();
  });
}
