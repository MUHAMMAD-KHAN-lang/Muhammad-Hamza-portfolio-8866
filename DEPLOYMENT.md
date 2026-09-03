# Deployment & Maintenance

Everything needed to publish this site on GitHub Pages and keep it current.

---

## 1. Publish the repository

The repository name is **`Muhammad-Hamza-portfolio-8866`** on the account
**`MUHAMMAD-KHAN-lang`**, which produces the URL:

```
https://MUHAMMAD-KHAN-lang.github.io/Muhammad-Hamza-portfolio-8866/
```

### Option A — push from this folder (recommended)

Run these from the folder containing `index.html`:

```bash
git init -b main
git add .
git commit -m "Initial commit: engineering portfolio"
git remote add origin https://github.com/MUHAMMAD-KHAN-lang/Muhammad-Hamza-portfolio-8866.git
git push -u origin main
```

If the repository does not exist yet, create it first at
<https://github.com/new> — name it `Muhammad-Hamza-portfolio-8866`, set it to **Public**, and do
**not** add a README, .gitignore or licence (this folder already has what it needs).

Git will ask for credentials on the first push. Use your GitHub username and a
**personal access token** as the password (GitHub no longer accepts account passwords over HTTPS).
Create one at *Settings → Developer settings → Personal access tokens → Tokens (classic)* with the
`repo` scope. Alternatively, install [GitHub Desktop](https://desktop.github.com/) and publish the
folder from there — it handles authentication for you.

### Option B — upload through the browser

Create the repository as above, then use **Add file → Upload files** and drag in the whole contents of
this folder. This works, but the `.github/` folder and `.nojekyll` are easy to miss — make sure both
are included.

---

## 2. Turn on GitHub Pages

1. Open the repository → **Settings** → **Pages**.
2. Under **Build and deployment → Source**, choose **Deploy from a branch**.
3. Branch: **`main`**, folder: **`/ (root)`**. Save.
4. Wait 1–2 minutes, then open
   <https://MUHAMMAD-KHAN-lang.github.io/Muhammad-Hamza-portfolio-8866/>.

`.nojekyll` is already present, so GitHub serves the files exactly as they are.

---

## 3. Turn on the project sync workflow

The workflow at `.github/workflows/update-projects.yml` regenerates `data/projects.json` from the
public repositories on the account.

1. Repository → **Settings** → **Actions** → **General**.
2. Under **Workflow permissions**, select **Read and write permissions**, then save.
   (The workflow commits the refreshed `data/projects.json` back to the repository.)
3. Repository → **Actions** → **Update projects** → **Run workflow** to populate it immediately.

After that it runs automatically every day at 04:00 UTC, and whenever `js/config.js` changes.

No secret or token is ever required — Actions supplies `GITHUB_TOKEN` automatically, and it never
leaves the workflow run.

**The site works even before this workflow has ever run.** It queries the public GitHub API directly
from the visitor's browser as well; the JSON snapshot exists so the page is instant and keeps working
if the API is rate-limited or unreachable.

---

## 4. Publishing a new project

This is the part designed to need no website edits at all:

1. Create a **public** repository for the project.
2. Give it a real description — this is the text shown on the project card.
3. Add topics. Anything in `PROJECT_CONFIG.engineeringTopics` counts, e.g.
   `uav`, `uas`, `drone`, `control-systems`, `control-theory`, `embedded`, `electronics`,
   `robotics`, `simulation`, `systems-engineering`, `aerospace`, `cad`, `python`, `cpp`.
4. Optional but useful:
   - `portfolio` or `engineering-portfolio` → guarantees the repository is shown.
   - `portfolio-featured` → gives it headline placement at the top of the section.
5. Push.

It appears on the site on the next page load.

**To hide a repository:** remove its engineering topics, or add its exact name to
`PROJECT_CONFIG.excludeRepos` in `js/config.js`.

Repositories with no engineering signal are not deleted from view — they sit behind the
*"Show all repositories"* toggle at the bottom of the Projects section.

---

## 5. Adding the CV PDF

Put the file at:

```
assets/documents/Muhammad_Hamza_CV.pdf
```

and push. Every Download CV button starts working immediately. To update it later, replace the file
with the same name. To use a different filename, change `cvPath` in `js/config.js` — it is the only
place the path is written.

Until the PDF exists, the buttons stay on the page but explain that it has not been uploaded yet,
rather than producing a broken download.

---

## 6. Keeping the experience figures current

The two experience figures are never typed into the markup. They are computed at page load from two
dates in `js/config.js`:

```js
practicalExperienceStartDate: "2024",
technicalDevelopmentStartDate: "2020",
```

`calculateCompletedYears()` in `js/main.js` counts only anniversaries that have actually passed, so
the hero, the Experience section and the profile page all increment on their own. A bare year is
read as 1 January of that year; write a full `"YYYY-MM-DD"` instead if a figure should turn over on
an exact anniversary rather than with the calendar.

---

## 7. Writing a full project detail page

Project detail pages live at `projects/?repo=<repository-name>` and are generated from live repository
metadata. To add a proper engineering write-up for a specific project, add an entry to
`data/project-details.json` under `projects`:

```json
{
  "projects": {
    "my-uav-controller": {
      "problem": "…",
      "objective": "…",
      "approach": "…",
      "architecture": "…",
      "model": "…",
      "implementation": "…",
      "results": "…",
      "images": ["../assets/images/my-uav-controller-block-diagram.png"],
      "documentation": "https://…"
    }
  }
}
```

Every field is optional. Fields you omit are simply not rendered — the page never invents content.

---

## 8. Local preview

Open `index.html` directly in a browser and most of the page works, but `fetch()` on `data/*.json` is
blocked for `file://` URLs. Serve the folder over HTTP instead:

```bash
python -m http.server 8080
# then open http://localhost:8080
```

---

## 9. Custom domain (optional)

1. Add a file named `CNAME` at the repository root containing only the domain, e.g. `hamza.engineer`.
2. At your DNS provider, point the domain at GitHub Pages
   (`A` records to GitHub's Pages IPs, or a `CNAME` to `MUHAMMAD-KHAN-lang.github.io`).
3. Repository → Settings → Pages → **Custom domain**, enter it, and tick **Enforce HTTPS**.
4. Update `siteUrl` in `js/config.js`, plus the `canonical` / Open Graph URLs in `index.html`,
   `profile.html`, `projects/index.html`, `sitemap.xml`, `robots.txt` and the paths in `404.html`.

---

## 10. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Projects section shows "temporarily unavailable" | GitHub API rate limit from that network, or no public repositories yet | Run the **Update projects** workflow so `data/projects.json` is populated; the site then loads from it |
| A new repository does not appear | It is private, a fork, or has no engineering topic or description | Make it public and add a relevant topic |
| Download CV button explains the PDF is missing | The PDF has not been added | Add `assets/documents/Muhammad_Hamza_CV.pdf` |
| Site shows raw file listing or 404 after enabling Pages | Wrong branch/folder selected | Settings → Pages → branch `main`, folder `/ (root)` |
| Styling missing on a subpage | A path was changed by hand | Paths are relative: root pages use `css/style.css`, `projects/` uses `../css/style.css` |
| Workflow fails with a permissions error | Actions cannot write to the repository | Settings → Actions → General → Workflow permissions → **Read and write** |
