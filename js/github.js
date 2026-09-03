/* ==========================================================================
   github.js — automatic project discovery, editorial presentation
   --------------------------------------------------------------------------
   The DATA is automatic. The PRESENTATION is not: repositories are ranked,
   classified and laid out as case-study blocks and an index, so the section
   reads like selected work rather than a GitHub API viewer.

   Architecture (unchanged, and deliberately boring):
     1. data/projects.json — written by a GitHub Actions workflow. Instant,
        no rate limit, survives the API being unreachable.
     2. The live public API, queried in the background, so a repository made
        minutes ago appears without waiting for the next sync.
     3. If both fail: a professional fallback and a direct GitHub link.

   No tokens. No backend. Public repository data only.
   ========================================================================== */
(function () {
  "use strict";

  var CFG   = window.SITE_CONFIG || {};
  var PCFG  = window.PROJECT_CONFIG || {};
  var RULES = window.DOMAIN_RULES || [];
  var E     = window.EMH || { esc: function (s) { return s; }, date: function (s) { return s; }, gh: function () { return "#"; } };
  var esc   = E.esc;

  var results = document.getElementById("results");
  var filters = document.getElementById("filters");
  var count   = document.getElementById("count");
  var status  = document.getElementById("status");
  var actions = document.getElementById("workActions");
  if (!results) return;

  var PROFILE = E.gh();

  var S = { list: [], src: null, at: null, filter: "all", showAll: !!PCFG.showUnclassified, done: false };

  /* ----------------------------------------------------- classification */
  function low(a) { return (a || []).map(function (t) { return String(t).toLowerCase(); }); }
  function any(t, c) { for (var i = 0; i < t.length; i++) if (c.indexOf(t[i]) !== -1) return true; return false; }

  function domainOf(topics, lang, text) {
    for (var i = 0; i < RULES.length; i++) if (any(topics, RULES[i].match)) return RULES[i].label;
    if (/\buav|drone|quadcopter|flight\b/.test(text)) return "UAV / UAS";
    if (/\bcontrol|pid|kalman|observer|stability\b/.test(text)) return "Control Systems";
    if (/\bembedded|firmware|microcontroller|stm32|arduino\b/.test(text)) return "Embedded Systems";
    if (/\bsimulat|model\b/.test(text)) return "Modeling & Simulation";
    if (lang) return "Computational Engineering";
    return "Engineering";
  }

  function initials(name) {
    var parts = String(name || "").split(/[^A-Za-z0-9]+/).filter(Boolean);
    if (!parts.length) return "—";
    if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
    return parts.slice(0, 3).map(function (p) { return p[0]; }).join("").toUpperCase();
  }

  function classify(repo) {
    var topics = low(repo.topics);
    var name   = String(repo.name || "").toLowerCase();
    var desc   = String(repo.description || "").toLowerCase();
    var text   = name.replace(/[-_]/g, " ") + " " + desc;

    var isFeat = topics.indexOf(String(PCFG.featuredTopic || "").toLowerCase()) !== -1;
    var isPort = any(topics, low(PCFG.portfolioTopics));
    var isEng  = any(topics, low(PCFG.engineeringTopics));

    var kw = false, keys = low(PCFG.engineeringKeywords);
    for (var i = 0; i < keys.length; i++) { if (text.indexOf(keys[i]) !== -1) { kw = true; break; } }

    var tier = isFeat ? "featured"
             : (isPort || isEng) ? "engineering"
             : (kw && (desc || topics.length)) ? "engineering"
             : "other";

    var score = 0;
    if (isFeat) score += 1000;
    if (isPort) score += 300;
    if (isEng)  score += 200;
    if (kw)     score += 60;
    score += Math.min(topics.length, 8) * 12;
    if (repo.description) score += 40;
    if (repo.homepage)    score += 15;
    if (repo.has_pages)   score += 10;
    score += Math.min(repo.stargazers_count || 0, 50) * 2;

    var upd = Date.parse(repo.pushed_at || repo.updated_at || 0) || 0;
    if (upd) score += Math.max(0, 90 - (Date.now() - upd) / 86400000) / 3;

    return { tier: tier, score: score, domain: domainOf(topics, repo.language, text) };
  }

  function shape(repo) {
    var m = classify(repo);
    return {
      name: repo.name,
      desc: repo.description || "",
      url: repo.html_url || ("https://github.com/" + CFG.githubUsername + "/" + repo.name),
      home: repo.homepage || "",
      lang: repo.language || "",
      topics: (repo.topics || []).slice(0, 8),
      upd: repo.pushed_at || repo.updated_at || "",
      created: repo.created_at || "",
      stars: repo.stargazers_count || 0,
      archived: !!repo.archived,
      tier: m.tier, score: m.score, domain: m.domain,
      ini: initials(repo.name)
    };
  }

  function skip(repo) {
    var n = String(repo.name || "").toLowerCase();
    var out = low(PCFG.excludeRepos).concat([
      String(CFG.repoName || "").toLowerCase(),
      String(CFG.githubUsername || "").toLowerCase(),
      ".github"
    ]);
    if (out.indexOf(n) !== -1) return true;
    if (repo.private) return true;
    if (PCFG.hideForks && repo.fork) return true;
    if (PCFG.hideArchived && repo.archived) return true;
    return false;
  }

  function prepare(repos) {
    if (!Array.isArray(repos)) return [];
    return repos.filter(function (r) { return r && r.name && !skip(r); })
                .map(shape)
                .sort(function (a, b) { return b.score - a.score; });
  }

  /* ------------------------------------------------------------- sources */
  function snapshot() {
    if (!window.fetch) return Promise.reject(new Error("no fetch"));
    return fetch("data/projects.json", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("snapshot " + r.status); return r.json(); })
      .then(function (p) {
        var repos = Array.isArray(p) ? p : (p.repositories || []);
        if (!repos.length) throw new Error("snapshot empty");
        return { repos: repos, at: p.generatedAt || null };
      });
  }

  function live() {
    if (!window.fetch) return Promise.reject(new Error("no fetch"));
    var u = CFG.githubUsername;
    if (!u || /^your_github_username$/i.test(u)) return Promise.reject(new Error("username not configured"));
    return fetch("https://api.github.com/users/" + encodeURIComponent(u) +
                 "/repos?per_page=" + (PCFG.perPage || 100) + "&sort=updated&type=owner",
                 { headers: { Accept: "application/vnd.github+json" } })
      .then(function (r) {
        if (r.status === 403 || r.status === 429) throw new Error("rate-limited");
        if (r.status === 404) throw new Error("user-not-found");
        if (!r.ok) throw new Error("api " + r.status);
        return r.json();
      })
      .then(function (repos) {
        if (!Array.isArray(repos)) throw new Error("malformed response");
        return repos;
      });
  }

  /* ------------------------------------------------------------ markup */
  function plate(p) {
    return '<div class="plate">' +
      '<span class="plate__c"></span><span class="plate__c"></span>' +
      '<span class="plate__c"></span><span class="plate__c"></span>' +
      '<span class="plate__acc"></span>' +
      '<span class="plate__cn"><span class="plate__ini">' + esc(p.ini) + '</span></span>' +
      (p.lang ? '<span class="plate__lang">' + esc(p.lang) + '</span>' : '') +
    '</div>';
  }

  function featured(p, i) {
    var n = ("0" + (i + 1)).slice(-2);
    return '<article class="feat rv">' +
      '<div>' +
        '<p class="feat__no">Featured &nbsp;' + n + '&nbsp; — &nbsp;' + esc(p.domain) + '</p>' +
        '<h3 class="feat__t"><a href="' + esc(p.url) + '" target="_blank" rel="noopener noreferrer">' + esc(p.name) + '</a></h3>' +
        (p.desc
          ? '<p class="feat__d">' + esc(p.desc) + '</p>'
          : '<p class="feat__d" style="color:var(--tx-3)">No repository description provided — the repository itself is the record.</p>') +
        '<dl class="feat__meta">' +
          '<div><dt>Domain</dt><dd>' + esc(p.domain) + '</dd></div>' +
          '<div><dt>Language</dt><dd>' + esc(p.lang || "Not specified") + '</dd></div>' +
          (p.topics.length ? '<div><dt>Topics</dt><dd>' + esc(p.topics.join(" · ")) + '</dd></div>' : '') +
          '<div><dt>Updated</dt><dd>' + esc(E.date(p.upd)) + '</dd></div>' +
        '</dl>' +
        '<div class="btns" style="margin-top:1.5rem">' +
          '<a class="btn btn--line" href="' + esc(p.url) + '" target="_blank" rel="noopener noreferrer">Repository <span class="ar" aria-hidden="true">→</span></a>' +
          '<a class="btn btn--line" href="projects/?repo=' + encodeURIComponent(p.name) + '">Case study <span class="ar" aria-hidden="true">→</span></a>' +
          (p.home ? '<a class="btn btn--line" href="' + esc(p.home) + '" target="_blank" rel="noopener noreferrer">Live</a>' : '') +
        '</div>' +
      '</div>' +
      '<div class="feat__side">' + plate(p) + '</div>' +
    '</article>';
  }

  function row(p, i) {
    var n = ("0" + (i + 1)).slice(-2);
    return '<a class="prjlink" href="projects/?repo=' + encodeURIComponent(p.name) + '">' +
      '<span class="prjlink__no">' + n + '</span>' +
      '<span class="prjlink__n">' + esc(p.name) + '</span>' +
      '<span class="prjlink__d">' + esc(p.desc || "No description provided") + '</span>' +
      '<span class="prjlink__m">' + esc(p.domain) + '</span>' +
      '<span class="prjlink__a" aria-hidden="true">→</span>' +
    '</a>';
  }

  /* ----------------------------------------------------------- rendering */
  function visible() {
    return S.list.filter(function (p) {
      if (p.tier === "other" && !S.showAll) return false;
      if (S.filter === "all") return true;
      if (S.filter === "featured") return p.tier === "featured";
      return p.domain === S.filter;
    });
  }

  function paintFilters() {
    if (!filters) return;
    var doms = {};
    S.list.forEach(function (p) {
      if (p.tier === "other" && !S.showAll) return;
      doms[p.domain] = (doms[p.domain] || 0) + 1;
    });

    var out = ['<button type="button" data-f="all">All</button>'];
    if (S.list.some(function (p) { return p.tier === "featured"; })) {
      out.push('<button type="button" data-f="featured">Featured</button>');
    }
    Object.keys(doms).sort().forEach(function (d) {
      out.push('<button type="button" data-f="' + esc(d) + '">' + esc(d) + ' <span style="opacity:.6">' + doms[d] + '</span></button>');
    });

    filters.innerHTML = out.join("");
    Array.prototype.forEach.call(filters.querySelectorAll("button"), function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-f") === S.filter ? "true" : "false");
      b.addEventListener("click", function () {
        S.filter = b.getAttribute("data-f");
        paintFilters(); paintList();
      });
    });
  }

  function paintActions() {
    if (!actions) return;
    var hidden = S.list.filter(function (p) { return p.tier === "other"; }).length;
    var out = ['<a class="btn btn--line" href="projects/">All projects <span class="ar" aria-hidden="true">→</span></a>',
               '<a class="btn btn--line" href="' + PROFILE + '" target="_blank" rel="noopener noreferrer">GitHub profile</a>'];
    if (hidden) {
      out.push('<button type="button" class="btn btn--line" id="toggleAll">' +
        (S.showAll ? "Engineering projects only" : "Show all repositories (" + hidden + ")") + '</button>');
    }
    actions.innerHTML = out.join("");
    var t = document.getElementById("toggleAll");
    if (t) t.addEventListener("click", function () {
      S.showAll = !S.showAll; S.filter = "all";
      paintFilters(); paintList(); paintActions();
    });
  }

  function paintList() {
    var items = visible();

    if (!items.length) {
      results.innerHTML = '<div class="state"><h3>Nothing under this filter</h3>' +
        '<p>No public repository matches it yet. Repositories tagged with engineering topics on ' +
        'GitHub appear here automatically.</p></div>';
    } else {
      var feats = items.filter(function (p) { return p.tier === "featured"; }).slice(0, PCFG.maxFeatured || 3);
      var rest  = items.filter(function (p) { return feats.indexOf(p) === -1; });

      /* With no explicitly featured repository, the strongest one still leads —
         the section should never open on a plain list. */
      if (!feats.length && rest.length) { feats = [rest.shift()]; }

      var html = feats.map(featured).join("");
      if (rest.length) {
        html += '<p class="tick rv" style="margin:clamp(1.5rem,4vw,2.5rem) 0 .5rem">Index — ' + rest.length + ' more</p>' +
                '<div class="rows">' + rest.map(row).join("") + '</div>';
      }
      results.innerHTML = html;
    }

    /* Newly injected nodes still deserve the reveal treatment. */
    Array.prototype.forEach.call(results.querySelectorAll(".rv"), function (el) { el.classList.add("in"); });

    if (count) {
      var total = S.list.filter(function (p) { return S.showAll ? true : p.tier !== "other"; }).length;
      count.textContent = items.length + " of " + total + " · " +
        (S.src === "live" ? "live from GitHub" : ("synced " + (S.at ? E.date(S.at) : "from repository data")));
    }
    if (status) status.textContent = items.length + " projects loaded.";
    S.done = true;
  }

  function paintAll(repos, src, at) {
    var list = prepare(repos);
    S.list = list; S.src = src; S.at = at || null;

    /* "Nothing to show" is not the same as "no repositories". A profile made
       only of unclassified repositories still has nothing engineering to
       list, so it gets the empty state — and the show-all toggle, which
       paintActions() builds from S.list, still reveals them on request. */
    var shown = list.filter(function (p) { return p.tier !== "other"; });
    if (!shown.length && !S.showAll) { empty(); return; }
    if (!list.length) { empty(); return; }

    paintFilters(); paintList(); paintActions();
  }

  function empty() {
    if (filters) filters.innerHTML = "";
    if (count) count.textContent = "";
    results.innerHTML = '<div class="state">' +
      '<h3>No public engineering repositories yet</h3>' +
      '<p>Public repositories carrying engineering topics will be listed here automatically as they ' +
      'are published — no edit to this page required.</p>' +
      '<p style="margin-top:1.25rem"><a class="alink" href="' + PROFILE + '" target="_blank" rel="noopener noreferrer">' +
      'Open GitHub profile <span class="ar" aria-hidden="true">→</span></a></p></div>';
    if (status) status.textContent = "No projects available.";
    S.done = true;
    paintActions();
  }

  function failed(why) {
    if (filters) filters.innerHTML = "";
    if (count) count.textContent = "";
    var msg = "Project repositories are temporarily unavailable. Please visit GitHub directly to view the latest engineering work.";
    if (why === "rate-limited") {
      msg = "GitHub's public API rate limit has been reached from this network. The list will load again shortly — the repositories are on GitHub in the meantime.";
    } else if (why === "user-not-found") {
      msg = "The configured GitHub account could not be found. Check githubUsername in js/config.js.";
    } else if (why === "username not configured") {
      msg = "The GitHub username has not been configured yet. Set githubUsername in js/config.js.";
    }
    results.innerHTML = '<div class="state"><h3>Projects unavailable</h3><p>' + esc(msg) + '</p>' +
      '<p style="margin-top:1.25rem"><a class="alink" href="' + PROFILE + '" target="_blank" rel="noopener noreferrer">' +
      'View projects on GitHub <span class="ar" aria-hidden="true">→</span></a></p></div>';
    if (status) status.textContent = "Projects could not be loaded.";
    S.done = true;
  }

  /* ---------------------------------------------------------------- boot */
  var liveErr = null;

  var livePromise = live()
    .then(function (repos) { paintAll(repos, "live", null); return true; })
    .catch(function (err) { liveErr = (err && err.message) || "unavailable"; return false; });

  snapshot()
    .then(function (p) { if (S.src !== "live") paintAll(p.repos, "snapshot", p.at); })
    .catch(function () {
      livePromise.then(function (ok) { if (!ok && !S.done) failed(liveErr); });
    });

  setTimeout(function () { if (!S.done) failed(liveErr); }, 12000);
})();
