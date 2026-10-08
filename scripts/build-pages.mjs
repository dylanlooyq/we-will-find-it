// Builds the static GitHub Pages version of the site into ./out — the same thing the
// deploy workflow does, runnable locally:   npm run build:pages
//
// In GitHub Actions, GITHUB_REPOSITORY ("owner/repo") is already set. Locally we derive it
// from the git remote so the base path (/<repo>/) matches what Pages will serve.
import { execSync, spawnSync } from "node:child_process";

function repoFromRemote() {
  try {
    const url = execSync("git config --get remote.origin.url", { encoding: "utf8" }).trim();
    const m = url.match(/github\.com[:/]+([^/]+)\/([^/]+?)(?:\.git)?$/i);
    return m ? `${m[1]}/${m[2]}` : "";
  } catch {
    return "";
  }
}

const repository = process.env.GITHUB_REPOSITORY || repoFromRemote();
if (!repository) {
  console.warn("build:pages — no GitHub repository detected; building for the site root (no base path).");
}

const result = spawnSync("npm run build", {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, STATIC_EXPORT: "true", ...(repository && { GITHUB_REPOSITORY: repository }) },
});
if (result.status !== 0) process.exit(result.status ?? 1);

// Give Next's generated PNGs real extensions + correct URLs for GitHub Pages
const finalize = spawnSync(process.execPath, ["scripts/finalize-pages.mjs", "out"], { stdio: "inherit" });
process.exit(finalize.status ?? 1);
