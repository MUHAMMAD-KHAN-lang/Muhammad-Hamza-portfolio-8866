/* ==========================================================================
   projects.js — project explorer and project detail pages
   --------------------------------------------------------------------------
   Two modes, one file, driven by the query string:
     projects/                 → full explorer of every discovered project
     projects/?repo=<name>     → detail page for one repository

   Detail content comes from two honest sources only:
     1. Real GitHub repository metadata.
     2. Optional hand-written sections in data/project-details.json.
   Nothing is inferred from a repository name. Missing sections are shown as
   explicit placeholders rather than invented.
   ========================================================================== */
(function () {
  "use strict";

  var CFG   = window.SITE_CONFIG || {};
  var PCFG  = window.PROJECT_CONFIG || {};
  var RULES = window.DOMAIN_RULES || [];
  var U     = window.PortfolioUtils;
  var esc   = U.escapeHtml;

  var root = document.getElementById("projectApp");
  if (!root) return;

  var params  = new URLSearchParams(window.location.search);
  var repoArg = (params.get("repo") || "").trim();
  var PROFILE_URL = U.githubProfileUrl();

  /* ------------------------------------------------------------------ */
  function lower(list) { return (list || []).map(function (t) { return String(t).toLowerCase(); }); }
  function hasAny(topics, candidates) {
    for (var i = 0; i < topics.length; i++) if (candidates.indexOf(topics[i]) !== -1) return true;
    return false;
  }
  function resolveDomain(topics, language, text) {
    for (var i = 0; i < RULES.length; i++) if (hasAny(topics, RULES[i].match)) return RULES[i].label;
    if (/\buav|drone|quadcopter|flight\b/.test(text)) return "UAV / UAS";
    if (/\bcontrol|pid|kalman|observer\b/.test(text)) return "Control Systems";
    if (/\bembedded|firmware|microcontroller\b/.test(text)) return "Embedded Systems";
    if (language) return "Computational Engineering";
    return "Engineering";
  }

  function loadRepos() {
    var live = fetch("https://api.github.com/users/" + encodeURIComponent(CFG.githubUsername) +
        "/repos?per_page=100&sort=updated&type=owner", { headers: { Accept: "application/vnd.github+json" } })
      .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); });

    var snapshot = fetch("../data/projects.json", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then(function (p) {
        var repos = Array.isArray(p) ? p : (p.repositories || []);
        if (!repos.length) throw new Error("empty");
        return repos;
      });

    return live.catch(function () { return snapshot; });
  }

  function loadDetails() {
    return fetch("../data/project-details.json", { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : { projects: {} }; })
      .then(function (p) { return (p && p.projects) || {}; })
      .catch(function () { return {}; });
  }

  function decorate(repo) {
    var topics = lower(repo.topics);
    var text   = String(repo.name || "").toLowerCase().replace(/[-_]/g, " ") + " " +
                 String(repo.description || "").toLowerCase();
    return {
      name: repo.name,
      description: repo.description || "",
      url: repo.html_url || ("https://github.com/" + CFG.githubUsername + "/" + repo.name),
      homepage: repo.homepage || "",
      language: repo.language || "",
      topics: repo.topics || [],
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      license: repo.license || null,
      branch: repo.default_branch || "main",
      created: repo.created_at || "",
      updated: repo.pushed_at || repo.updated_at || "",
      archived: !!repo.archived,
      featured: topics.indexOf(String(PCFG.featuredTopic || "").toLowerCase()) !== -1,
      domain: resolveDomain(topics, repo.language, text)
    };
  }

  /* ================================================================== */
  /*  Detail page                                                        */
  /* ================================================================== */
  function renderDetail(repo, detail) {
    var p = decorate(repo);
    document.title = p.name + " — Engineer Muhammad Hamza";

    var sections = [
      ["Problem",             detail.problem],
      ["Objective",           detail.objective],
      ["Engineering Approach", detail.approach],
      ["Architecture",        detail.architecture],
      ["Mathematical Model",  detail.model],
      ["Implementation",      detail.implementation],
      ["Results",             detail.results]
    ];

    var written = sections.filter(function (s) { return s[1]; });

    var body = written.length
      ? written.map(function (s) {
          return '<section class="cv-block"><h2 class="cv-block__title">' + esc(s[0]) + "</h2>" +
                 "<p>" + esc(s[1]) + "</p></section>";
        }).join("")
      : '<section class="cv-block">' +
          '<h2 class="cv-block__title">Technical Detail</h2>' +
          '<div class="state" style="text-align:left">' +
            "<p style=\"margin-bottom:.75rem\">An extended technical write-up for this project — problem, objective, " +
            "engineering approach, architecture, mathematical model, implementation and results — " +
            "has not been published on this site yet.</p>" +
            "<p style=\"margin:0\">The repository itself, including its README and source, is the " +
            "authoritative record in the meantime.</p>" +
          "</div>" +
        "</section>";

    var images = (detail.images || []).length
      ? '<section class="cv-block"><h2 class="cv-block__title">Diagrams &amp; Images</h2>' +
          '<div class="grid grid--2">' +
            detail.images.map(function (src) {
              return '<img src="' + esc(src) + '" alt="' + esc(p.name) + ' project figure" loading="lazy" style="border:1px solid var(--line);border-radius:4px">';
            }).join("") +
          "</div></section>"
      : "";

    root.innerHTML =
      '<div class="cv-header">' +
        '<p class="section-index">Project &nbsp;/&nbsp; ' + esc(p.domain) + "</p>" +
        "<h1 style=\"font-size:clamp(1.8rem,4vw,2.6rem)\">" + esc(p.name) + "</h1>" +
        (p.description
          ? "<p style=\"color:var(--ink-muted);font-size:1.05rem\">" + esc(p.description) + "</p>"
          : "<p style=\"color:var(--ink-faint);font-style:italic\">No repository description provided.</p>") +
        (p.topics.length
          ? '<div class="tag-row" style="margin:1rem 0">' +
              p.topics.map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") +
            "</div>"
          : "") +
        '<div class="btn-row" style="margin-top:1.25rem">' +
          '<a class="btn btn--primary" href="' + esc(p.url) + '" target="_blank" rel="noopener noreferrer">View Repository</a>' +
          (p.homepage ? '<a class="btn btn--outline" href="' + esc(p.homepage) + '" target="_blank" rel="noopener noreferrer">Live Site</a>' : "") +
          (detail.documentation ? '<a class="btn btn--outline" href="' + esc(detail.documentation) + '" target="_blank" rel="noopener noreferrer">Documentation</a>' : "") +
          '<a class="btn btn--outline" href="./">All Projects</a>' +
        "</div>" +
      "</div>" +

      '<section class="cv-block"><h2 class="cv-block__title">Repository Metadata</h2>' +
        '<dl class="deflist">' +
          "<div class=\"deflist__row\"><dt class=\"deflist__term\">Domain</dt><dd class=\"deflist__desc\">" + esc(p.domain) + "</dd></div>" +
          "<div class=\"deflist__row\"><dt class=\"deflist__term\">Primary language</dt><dd class=\"deflist__desc\">" + esc(p.language || "Not specified") + "</dd></div>" +
          "<div class=\"deflist__row\"><dt class=\"deflist__term\">Topics</dt><dd class=\"deflist__desc\">" + esc(p.topics.join(", ") || "None") + "</dd></div>" +
          "<div class=\"deflist__row\"><dt class=\"deflist__term\">Default branch</dt><dd class=\"deflist__desc\">" + esc(p.branch) + "</dd></div>" +
          "<div class=\"deflist__row\"><dt class=\"deflist__term\">Created</dt><dd class=\"deflist__desc\">" + esc(U.formatDate(p.created)) + "</dd></div>" +
          "<div class=\"deflist__row\"><dt class=\"deflist__term\">Last updated</dt><dd class=\"deflist__desc\">" + esc(U.formatDate(p.updated)) + "</dd></div>" +
        "</dl></section>" +

      body + images;
  }

  /* ================================================================== */
  /*  Explorer                                                           */
  /* ================================================================== */
  function renderExplorer(repos) {
    var items = repos
      .filter(function (r) {
        var n = String(r.name || "").toLowerCase();
        if (r.private) return false;
        if (PCFG.hideForks && r.fork) return false;
        return n !== String(CFG.repoName || "").toLowerCase() &&
               n !== String(CFG.githubUsername || "").toLowerCase();
      })
      .map(decorate)
      .sort(function (a, b) {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return Date.parse(b.updated || 0) - Date.parse(a.updated || 0);
      });

    if (!items.length) {
      root.innerHTML = '<div class="state"><h3>No public repositories found</h3>' +
        '<p>Projects appear here automatically once public repositories are published.</p></div>';
      return;
    }

    root.innerHTML =
      '<div class="cv-header">' +
        '<p class="section-index">Project Portfolio</p>' +
        "<h1 style=\"font-size:clamp(1.8rem,4vw,2.6rem)\">All Engineering Projects</h1>" +
        "<p style=\"color:var(--ink-muted)\">Every public repository, listed automatically from GitHub. " +
        "Select a project to open its detail page.</p>" +
        '<div class="btn-row" style="margin-top:1.25rem">' +
          '<a class="btn btn--outline" href="../index.html#projects">Back to portfolio</a>' +
          '<a class="btn btn--outline" href="' + PROFILE_URL + '" target="_blank" rel="noopener noreferrer">GitHub profile</a>' +
        "</div>" +
      "</div>" +
      '<div class="project-grid">' +
        items.map(function (p) {
          return '<article class="project-card' + (p.featured ? " project-card--featured" : "") + '">' +
            '<div class="project-card__top"><span class="pill' + (p.featured ? " pill--featured" : "") + '">' +
              esc(p.domain) + "</span></div>" +
            '<h3 class="project-card__title"><a href="?repo=' + encodeURIComponent(p.name) + '">' + esc(p.name) + "</a></h3>" +
            (p.description
              ? '<p class="project-card__desc">' + esc(p.description) + "</p>"
              : '<p class="project-card__desc is-empty">No repository description provided.</p>') +
            '<dl class="project-card__meta">' +
              "<div><dt>Language</dt><dd>" + esc(p.language || "Not specified") + "</dd></div>" +
              "<div><dt>Updated</dt><dd>" + esc(U.formatDate(p.updated)) + "</dd></div>" +
            "</dl>" +
            '<div class="project-card__actions">' +
              '<a class="btn btn--solid btn--sm" href="?repo=' + encodeURIComponent(p.name) + '">View Details</a>' +
              '<a class="btn btn--outline btn--sm" href="' + esc(p.url) + '" target="_blank" rel="noopener noreferrer">Repository</a>' +
            "</div></article>";
        }).join("") +
      "</div>";
  }

  function renderFailure() {
    root.innerHTML =
      '<div class="state">' +
        "<h3>Projects unavailable</h3>" +
        "<p>Project repositories are temporarily unavailable. Please visit GitHub directly to view the " +
        "latest engineering work.</p>" +
        '<div class="btn-row" style="justify-content:center;margin-top:1.25rem">' +
          '<a class="btn btn--primary btn--sm" href="' + PROFILE_URL + '" target="_blank" rel="noopener noreferrer">Open GitHub</a>' +
        "</div></div>";
  }

  /* ------------------------------------------------------------------ */
  Promise.all([loadRepos(), loadDetails()])
    .then(function (res) {
      var repos = res[0] || [];
      var details = res[1] || {};

      if (!repoArg) { renderExplorer(repos); return; }

      var match = repos.filter(function (r) {
        return String(r.name).toLowerCase() === repoArg.toLowerCase();
      })[0];

      if (!match) {
        root.innerHTML =
          '<div class="state"><h3>Project not found</h3>' +
          "<p>No public repository named <strong>" + esc(repoArg) + "</strong> was found on this account.</p>" +
          '<div class="btn-row" style="justify-content:center;margin-top:1.25rem">' +
            '<a class="btn btn--outline btn--sm" href="./">All projects</a></div></div>';
        return;
      }
      renderDetail(match, details[match.name] || {});
    })
    .catch(renderFailure);
})();
