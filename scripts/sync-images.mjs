// Scans /public/images/items and records which photos exist, so <ItemImage>
// can swap its "Image of …" placeholder for the real photo automatically.
//
//   1. Drop a file into public/images/items/ using the name shown on the
//      placeholder (e.g. iphone-14-pro-orchard-1.jpg)
//   2. Run `npm run images` (also runs before `dev` and `build`)
import { readdirSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "public", "images", "items");
const out = join(root, "src", "lib", "data", "available-images.json");

if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
const files = readdirSync(dir)
  .filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f))
  .sort();
writeFileSync(out, JSON.stringify(files, null, 2) + "\n");
console.log(`images: ${files.length} photo${files.length === 1 ? "" : "s"} found in public/images/items`);
