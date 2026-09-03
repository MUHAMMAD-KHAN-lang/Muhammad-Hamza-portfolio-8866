/* ==========================================================================
   projects.js — project index and per-project case-study pages
   --------------------------------------------------------------------------
     projects/               → the full index of public repositories
     projects/?repo=<name>   → one project, presented as a case study

   Detail content has exactly two honest sources: real repository metadata,
   and optional hand-written sections in data/project-details.json. Nothing is
   inferred from a repository name; missing sections are shown as explicit
   placeholders rather than invented.
   ========================================================================== */
(function () {
  "use strict";

  var CFG   = window.SITE_CONFIG || {};
  var PCFG  = window.PROJECT_CONFIG || {};
  var RULES = window.DOMAIN_RULES || [];
  var E     = window.EMH || {};
  var esc   = E.esc || function (s) { return s; };
  var fdate = E.date || function (s) { return s; };

  var app = document.getElementById("app");
  if (!app) return;

  var repoArg = (new URLSearchParams(window.location.search).get("repo") || "").trim();
  var PROFILE = E.gh ? E.gh() : ("https://github.com/" + (CFG.githubUsername || ""));

  function low(a) { return (a || []).map(function (t) { return String(t).toLowerCase(); }); }
  function any(t, c) { for (var i = 0; i < t.length; i++) if (c.indexOf(t[i]) !== -1) return true; return false; }

  function domainOf(topics, lang, text) {
    for (var i = 0; i < RULES.length; i++) if (any(topics, RULES[i].match)) return RULES[i].label;
    if (/\buav|drone|quadcopter|flight\b/.test(text)) return "UAV / UAS";
    if (/\bcontrol|pid|kalman|observer\b/.test(text)) return "Control Systems";
    if (/\bembedded|firmware|microcontroller\b/.test(text)) return "Embedded Systems";
    if (lang) return "Computational Engineering";
    return "Engineering";
  }

  function initials(name) {
    var p = String(name || "").split(/[^A-Za-z0-9]+/).filter(Boolean);
    if (!p.length) return "—";
    if (p.length === 1) return p[0].slice(0, 3).toUpperCase();
    return p.slice(0, 3).map(function (x) { return x[0]; }).join("").toUpperCase();
  }

  function shape(repo) {
    var topics = low(repo.topics);
    var text = String(repo.name || "").toLowerCase().replace(/[-_]/g, " ") + " " +
               String(repo.description || "").toLowerCase();
    return {
      name: repo.name,
      desc: repo.description || "",
      url: repo.html_url || ("https://github.com/" + CFG.githubUsername + "/" + repo.name),
      home: repo.homepage || "",
      lang: repo.language || "",
      topics: repo.topics || [],
      branch: repo.default_branch || "main",
      license: repo.license || null,
      created: repo.created_at || "",
      upd: repo.pushed_at || repo.updated_at || "",
      archived: !!repo.archived,
      featured: topics.indexOf(String(PCFG.featuredTopic || "").toLowerCase()) !== -1,
      domain: domainOf(topics, repo.language, text),
      ini: initials(repo.name)
    };
  }

  function loadRepos() {
    var live = fetch("https://api.github.com/users/" + encodeURIComponent(CFG.githubUsername) +
        "/repos?per_page=100&sort=updated&type=owner", { headers: { Accept: "application/vnd.github+json" } })
      .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); });

    var snap = fetch("../data/projects.json", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then(function (p) {
        var repos = Array.isArray(p) ? p : (p.repositories || []);
        if (!repos.length) throw new Error("empty");
        return repos;
      });

    return live.catch(function () { return snap; });
  }

  function loadDetails() {
    return fetch("../data/project-details.json", { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : { projects: {} }; })
      .then(function (p) { return (p && p.projects) || {}; })
      .catch(function () { return {}; });
  }

  function plate(p) {
    return '<div class="plate">' +
      '<span class="plate__c"></span><span class="plate__c"></span>' +
      '<span class="plate__c"></span><span class="plate__c"></span>' +
      '<span class="plate__acc"></span>' +
      '<span class="plate__cn"><span class="plate__ini">' + esc(p.ini) + '</span></span>' +
      (p.lang ? '<span class="plate__lang">' + esc(p.lang) + '</span>' : '') + '</div>';
  }

  /* ------------------------------------------------------------- detail */
  function detail(repo, d) {
    var p = shape(repo);
    document.title = p.name + " — Engineer Muhammad Hamza";
    var t = document.getElementById("pageTitle"), l = document.getElementById("pageLede");
    if (t) t.textContent = p.name;
    if (l) l.textContent = p.desc || "No repository description provided.";

    var sections = [
      ["Problem", d.problem], ["Objective", d.objective],
      ["Engineering approach", d.approach], ["Architecture", d.architecture],
      ["Mathematical model", d.model], ["Implementation", d.implementation],
      ["Results", d.results]
    ].filter(function (s) { return s[1]; });

    var written = sections.length
      ? sections.map(function (s, i) {
          return '<div class="blk rv"><h2 class="blk__t"><span>' + esc(s[0]) + '</span><span>' +
                 ("0" + (i + 1)).slice(-2) + '</span></h2><p class="body">' + esc(s[1]) + '</p></div>';
        }).join("")
      : '<div class="blk rv"><h2 class="blk__t"><span>Technical detail</span><span>—</span></h2>' +
        '<div class="state" style="text-align:left">' +
        '<p style="margin-bottom:.75rem">An extended write-up for this project — problem, objective, ' +
        'engineering approach, architecture, mathematical model, implementation and results — has not ' +
        'been published on this site yet.</p>' +
        '<p>The repository itself, including its README and source, is the authoritative record in the ' +
        'meantime.</p></div></div>';

    var images = (d.images || []).length
      ? '<div class="blk rv"><h2 class="blk__t"><span>Diagrams &amp; images</span><span>FIG</span></h2>' +
        '<div class="split" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,18rem),1fr))">' +
        d.images.map(function (src) {
          return '<img src="' + esc(src) + '" alt="' + esc(p.name) + ' figure" loading="lazy" style="border:1px solid var(--rule)">';
        }).join("") + '</div></div>'
      : "";

    app.innerHTML =
      '<div class="split--flip split rv" style="margin-bottom:clamp(2rem,5vw,3rem)">' +
        '<dl class="feat__meta">' +
          '<div><dt>Domain</dt><dd>' + esc(p.domain) + '</dd></div>' +
          '<div><dt>Language</dt><dd>' + esc(p.lang || "Not specified") + '</dd></div>' +
          '<div><dt>Topics</dt><dd>' + esc(p.topics.join(" · ") || "None") + '</dd></div>' +
          '<div><dt>Branch</dt><dd>' + esc(p.branch) + '</dd></div>' +
          '<div><dt>Created</dt><dd>' + esc(fdate(p.created)) + '</dd></div>' +
          '<div><dt>Updated</dt><dd>' + esc(fdate(p.upd)) + '</dd></div>' +
        '</dl>' +
        '<div>' + plate(p) +
          '<div class="btns" style="margin-top:1.25rem">' +
            '<a class="btn btn--fill" href="' + esc(p.url) + '" target="_blank" rel="noopener noreferrer">Open repository <span class="ar" aria-hidden="true">→</span></a>' +
            (p.home ? '<a class="btn btn--line" href="' + esc(p.home) + '" target="_blank" rel="noopener noreferrer">Live site</a>' : '') +
            (d.documentation ? '<a class="btn btn--line" href="' + esc(d.documentation) + '" target="_blank" rel="noopener noreferrer">Documentation</a>' : '') +
            '<a class="btn btn--line" href="./">All projects</a>' +
          '</div>' +
        '</div>' +
      '</div>' + written + images;

    show();
  }

  /* -------------------------------------------------------------- index */
  function index(repos) {
    var items = repos
      .filter(function (r) {
        var n = String(r.name || "").toLowerCase();
        if (r.private) return false;
        if (PCFG.hideForks && r.fork) return false;
        return n !== String(CFG.repoName || "").toLowerCase() &&
               n !== String(CFG.githubUsername || "").toLowerCase();
      })
      .map(shape)
      .sort(function (a, b) {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return Date.parse(b.upd || 0) - Date.parse(a.upd || 0);
      });

    if (!items.length) {
      app.innerHTML = '<div class="state"><h3>No public repositories found</h3>' +
        '<p>Projects appear here automatically once public repositories are published.</p></div>';
      return;
    }

    app.innerHTML = '<div class="rows rv" style="border-top:0">' + items.map(function (p, i) {
      return '<a class="prjlink" href="?repo=' + encodeURIComponent(p.name) + '">' +
        '<span class="prjlink__no">' + ("0" + (i + 1)).slice(-2) + '</span>' +
        '<span class="prjlink__n">' + esc(p.name) + (p.featured ? ' <span style="color:var(--accent-tx);font-family:var(--mono);font-size:.6rem;letter-spacing:.14em">FEATURED</span>' : '') + '</span>' +
        '<span class="prjlink__d">' + esc(p.desc || "No description provided") + '</span>' +
        '<span class="prjlink__m">' + esc(p.domain) + '</span>' +
        '<span class="prjlink__a" aria-hidden="true">→</span></a>';
    }).join("") + '</div>';
    show();
  }

  function show() {
    Array.prototype.forEach.call(app.querySelectorAll(".rv"), function (el) { el.classList.add("in"); });
  }

  function failed() {
    app.innerHTML = '<div class="state"><h3>Projects unavailable</h3>' +
      '<p>Project repositories are temporarily unavailable. Please visit GitHub directly to view the ' +
      'latest engineering work.</p><p style="margin-top:1.25rem">' +
      '<a class="alink" href="' + PROFILE + '" target="_blank" rel="noopener noreferrer">Open GitHub <span class="ar" aria-hidden="true">→</span></a></p></div>';
  }

  Promise.all([loadRepos(), loadDetails()])
    .then(function (res) {
      var repos = res[0] || [], details = res[1] || {};
      if (!repoArg) { index(repos); return; }

      var hit = repos.filter(function (r) {
        return String(r.name).toLowerCase() === repoArg.toLowerCase();
      })[0];

      if (!hit) {
        app.innerHTML = '<div class="state"><h3>Project not found</h3>' +
          '<p>No public repository named <strong>' + esc(repoArg) + '</strong> was found on this account.</p>' +
          '<p style="margin-top:1.25rem"><a class="alink" href="./">All projects <span class="ar" aria-hidden="true">→</span></a></p></div>';
        return;
      }
      detail(hit, details[hit.name] || {});
    })
    .catch(failed);
})();
