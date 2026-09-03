/**
 * fetch-projects.mjs
 * ---------------------------------------------------------------------------
 * Queries the public repositories of the configured GitHub account and writes
 * a trimmed snapshot to data/projects.json.
 *
 * Run by .github/workflows/update-projects.yml. Uses only the automatically
 * provided GITHUB_TOKEN (or no token at all) — no secret is ever required and
 * none is stored in this repository.
 *
 * Usage:  node .github/scripts/fetch-projects.mjs
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const ROOT = resolve(process.cwd());
const CONFIG_PATH = resolve(ROOT, "js/config.js");
const OUTPUT_PATH = resolve(ROOT, "data/projects.json");

/** Read githubUsername straight out of js/config.js so the username stays
 *  defined in exactly one place across the whole project. */
async function readUsername() {
  if (process.env.GITHUB_USERNAME) return process.env.GITHUB_USERNAME;
  const source = await readFile(CONFIG_PATH, "utf8");
  const match = source.match(/githubUsername\s*:\s*["'`]([^"'`]+)["'`]/);
  if (!match) throw new Error("githubUsername not found in js/config.js");
  return match[1];
}

async function fetchAllRepos(username) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "portfolio-project-sync",
    "X-GitHub-Api-Version": "2022-11-28"
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const all = [];
  for (let page = 1; page <= 10; page += 1) {
    const url = `https://api.github.com/users/${encodeURIComponent(username)}` +
                `/repos?per_page=100&page=${page}&sort=updated&type=owner`;
    const res = await fetch(url, { headers });

    if (!res.ok) {
      throw new Error(`GitHub API responded ${res.status} ${res.statusText}`);
    }
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}

/** Keep only the fields the website actually renders. */
function trim(repo) {
  return {
    name: repo.name,
    full_name: repo.full_name,
    description: repo.description,
    html_url: repo.html_url,
    homepage: repo.homepage || "",
    language: repo.language,
    topics: Array.isArray(repo.topics) ? repo.topics : [],
    stargazers_count: repo.stargazers_count || 0,
    forks_count: repo.forks_count || 0,
    open_issues_count: repo.open_issues_count || 0,
    size: repo.size || 0,
    license: repo.license ? repo.license.spdx_id : null,
    default_branch: repo.default_branch || "main",
    has_pages: !!repo.has_pages,
    archived: !!repo.archived,
    fork: !!repo.fork,
    private: !!repo.private,
    created_at: repo.created_at,
    updated_at: repo.updated_at,
    pushed_at: repo.pushed_at
  };
}

async function main() {
  const username = await readUsername();
  console.log(`Fetching public repositories for @${username} ...`);

  const repos = await fetchAllRepos(username);
  const visible = repos.filter((r) => r && !r.private).map(trim);

  visible.sort((a, b) =>
    Date.parse(b.pushed_at || b.updated_at || 0) - Date.parse(a.pushed_at || a.updated_at || 0)
  );

  const payload = {
    generatedAt: new Date().toISOString(),
    username,
    count: visible.length,
    repositories: visible
  };

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Wrote ${visible.length} repositories to data/projects.json`);
}

main().catch((error) => {
  console.error(`Project sync failed: ${error.message}`);
  process.exit(1);
});
