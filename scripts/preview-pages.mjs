// Serves ./out the way GitHub Pages will, so you can test the Pages build locally:
//   npm run build:pages && npm run preview:pages      → http://localhost:4173/<repo>/
//
// Emulated GitHub Pages behaviour: the site lives under /<repo>/, "/path" → "/path/" → index.html,
// "/page" falls back to page.html, unknown URLs get 404.html with a real 404 status, and files with
// no extension are served as application/octet-stream.
import { execSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, sep } from "node:path";

function repoFromRemote() {
  try {
    const url = execSync("git config --get remote.origin.url", { encoding: "utf8" }).trim();
    return url.match(/github\.com[:/]+[^/]+\/([^/]+?)(?:\.git)?$/i)?.[1] ?? "";
  } catch {
    return "";
  }
}

const OUT = join(process.cwd(), "out");
const repo = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? repoFromRemote();
const BASE = process.env.PAGES_BASE_PATH ?? (repo ? `/${repo}` : "");
const PORT = Number(process.env.PORT ?? 4173);

if (!existsSync(OUT)) {
  console.error('preview-pages: no "out" folder — run `npm run build:pages` first.');
  process.exit(1);
}

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".webmanifest": "application/manifest+json",
};

const isFile = (p) => existsSync(p) && statSync(p).isFile();

function send(res, status, file) {
  const type = TYPES[extname(file)] ?? "application/octet-stream";
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-cache" });
  res.end(readFileSync(file));
}

createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  let path = decodeURIComponent(url.pathname);
  const notFound = () => send(res, 404, join(OUT, "404.html"));

  if (BASE) {
    if (path === BASE) {
      res.writeHead(301, { Location: `${BASE}/` });
      return res.end();
    }
    if (!path.startsWith(`${BASE}/`)) return notFound();
    path = path.slice(BASE.length);
  }

  const file = normalize(join(OUT, path));
  if (!file.startsWith(OUT + sep) && file !== OUT) return notFound();

  if (isFile(file)) return send(res, 200, file);
  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!path.endsWith("/")) {
      res.writeHead(301, { Location: `${BASE}${path}/${url.search}` });
      return res.end();
    }
    if (isFile(join(file, "index.html"))) return send(res, 200, join(file, "index.html"));
  }
  if (isFile(`${file}.html`)) return send(res, 200, `${file}.html`);
  return notFound();
}).listen(PORT, () => console.log(`Preview of the GitHub Pages build: http://localhost:${PORT}${BASE}/`));
