// Post-processes the static export in ./out so it behaves on GitHub Pages.
// Runs automatically at the end of `npm run build:pages` (see scripts/build-pages.mjs).
//
// 1. Next emits its generated images (social-share cards and the apple-touch-icon) as
//    *extensionless* files. GitHub Pages picks Content-Type from the file extension, so those
//    would be served as application/octet-stream and some scrapers/browsers refuse them. We
//    rename them to <name>.png.
// 2. Next leaves the base path off the apple-touch-icon URL, and still points at the old
//    extensionless names. We rewrite those references everywhere they appear: the HTML <head>,
//    the inline flight data in each page, and the per-route .txt payloads the client router fetches.
// 3. On Windows, Next writes its router prefetch files (__next.<segments>.txt) into nested folders
//    instead of the flat dotted names the browser asks for (it splits on "/" but joins with "\").
//    Linux (GitHub Actions) is unaffected; this flattens them so a local build matches CI.
import { existsSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const OUT = process.argv[2] ?? "out";
if (!existsSync(OUT)) {
  console.error(`finalize-pages: "${OUT}" does not exist — run the static build first.`);
  process.exit(1);
}

const GENERATED = /^(apple-icon|opengraph-image(-[a-z0-9]+)?)$/;
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

function walk(dir, visit) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, visit);
    else visit(p, name);
  }
}

// 1) rename extensionless generated PNGs
let renamed = 0;
walk(OUT, (path, name) => {
  if (!GENERATED.test(name)) return;
  const head = readFileSync(path).subarray(0, 4);
  if (!head.equals(PNG_MAGIC)) return;
  renameSync(path, `${path}.png`);
  renamed++;
});

// 3) flatten nested router prefetch folders (Windows builds only)
let flattened = 0;
const nestedDirs = [];
(function find(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (!statSync(p).isDirectory()) continue;
    if (name.startsWith("__next.")) nestedDirs.push(p);
    else find(p);
  }
})(OUT);
for (const dir of nestedDirs) {
  walk(dir, (path) => {
    const flat = `${dir}.${relative(dir, path).split(sep).join(".")}`;
    renameSync(path, flat);
    flattened++;
  });
  rmSync(dir, { recursive: true, force: true });
}

// 2) fix references. The manifest link always carries the base path: "/<repo>/manifest.webmanifest" (or "/manifest...")
const indexHtml = readFileSync(join(OUT, "index.html"), "utf8");
const base = indexHtml.match(/<link rel="manifest" href="([^"]*)\/manifest\.webmanifest"/)?.[1] ?? "";

let patched = 0;
walk(OUT, (path, name) => {
  if (!name.endsWith(".html") && !name.endsWith(".txt")) return;
  const text = readFileSync(path, "utf8");
  const next = text
    // apple-touch-icon: "/apple-icon?<hash>" → "<base>/apple-icon.png"
    .replace(/(")\/apple-icon\?[A-Za-z0-9]+/g, `$1${base}/apple-icon.png`)
    // share cards: ".../opengraph-image[-id]?<hash>" → ".../opengraph-image[-id].png" (works for plain and JSON-escaped quotes)
    .replace(/\/(opengraph-image(?:-[a-z0-9]+)?)\?[A-Za-z0-9]+(?=\\?")/g, "/$1.png");
  if (next !== text) {
    writeFileSync(path, next);
    patched++;
  }
});

console.log(
  `finalize-pages: renamed ${renamed} generated image(s) to .png, flattened ${flattened} prefetch file(s), updated ${patched} file(s).`,
);
