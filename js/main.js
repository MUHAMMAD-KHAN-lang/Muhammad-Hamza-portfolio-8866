/* ==========================================================================
   main.js — EMH motion system, navigation, branding bindings
   No dependencies. Everything degrades: if this file fails, the page still
   reads, because the no-js / reduced-motion fallbacks in CSS keep content
   visible.
   ========================================================================== */
(function () {
  "use strict";

  var CFG = window.SITE_CONFIG || {};
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var HAS_IO  = "IntersectionObserver" in window;

  /* ---------------------------------------------------------------- utils */
  window.EMH = {
    esc: function (v) {
      return String(v == null ? "" : v)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    },
    date: function (iso) {
      if (!iso) return "—";
      var d = new Date(iso);
      if (isNaN(d.getTime())) return "—";
      try { return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" }); }
      catch (e) { return d.toISOString().slice(0, 7); }
    },
    gh: function () { return "https://github.com/" + encodeURIComponent(CFG.githubUsername || ""); },
    reduced: REDUCED
  };

  /* ------------------------------------------------------------ 1 · loader */
  (function loader() {
    var el = $("#loader");
    if (!el) { document.body.classList.remove("is-loading"); return; }
    if (REDUCED) { el.parentNode.removeChild(el); document.body.classList.remove("is-loading"); return; }

    var start = Date.now();
    var MIN = 900, MAX = 1500;

    function finish() {
      el.classList.add("done");
      document.body.classList.remove("is-loading");
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 520);
    }
    function ready() {
      var wait = Math.max(0, MIN - (Date.now() - start));
      setTimeout(finish, wait);
    }
    if (document.readyState === "complete") ready();
    else window.addEventListener("load", ready);
    setTimeout(finish, MAX);   // never trap the visitor
  })();

  /* ------------------------------------------- 2 · measure SVG path length */
  function measure(root) {
    $$(".draw", root || document).forEach(function (p) {
      try {
        var len = p.getTotalLength ? p.getTotalLength() : 0;
        if (len) p.style.setProperty("--len", Math.ceil(len + 2));
      } catch (e) { /* non-geometry node */ }
    });
  }
  measure();
  window.addEventListener("load", function () { measure(); });

  /* ----------------------------------------------------- 3 · reveal engine */
  var REVEAL = ".rv, .rv-l, .rv-line, .mask, svg.fig";

  if (!HAS_IO || REDUCED) {
    $$(REVEAL).forEach(function (el) { el.classList.add("in"); });
    $$("#ladder .ladder__s, #flowmap .flowmap__n, #flowmap .flowmap__v, #chain .chain__row")
      .forEach(function (el) { el.classList.add("on"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    $$(REVEAL).forEach(function (el) { io.observe(el); });

    /* Sequenced groups — progression is the point, so they step, not pop. */
    function sequence(containerSel, childSel, step) {
      var box = $(containerSel);
      if (!box) return;
      var kids = $$(childSel, box);
      var seq = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          kids.forEach(function (k, i) {
            setTimeout(function () { k.classList.add("on"); }, i * step);
          });
          obs.disconnect();
        });
      }, { rootMargin: "0px 0px -12% 0px", threshold: 0.12 });
      seq.observe(box);
    }
    sequence("#ladder",  ".ladder__s", 130);
    sequence("#flowmap", ".flowmap__n, .flowmap__v", 110);
    sequence("#chain",   ".chain__row", 90);
  }

  /* Late safety net: anything still hidden above the fold gets shown. */
  window.addEventListener("load", function () {
    setTimeout(function () {
      $$(REVEAL).forEach(function (el) {
        if (el.classList.contains("in")) return;
        var b = el.getBoundingClientRect();
        if (b.top < window.innerHeight * 1.1) el.classList.add("in");
      });
    }, 500);
  });

  /* --------------------------------------------------- 4 · header + nav */
  var hdr = $("#hdr");
  var hero = $(".hero");

  if (hdr) {
    if (hero && HAS_IO) {
      var hio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { hdr.classList.toggle("solid", !e.isIntersecting); });
      }, { rootMargin: "-72px 0px 0px 0px", threshold: 0 });
      hio.observe(hero);
    } else {
      var onScroll = function () { hdr.classList.toggle("solid", window.scrollY > 40); };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }
  }

  var burger = $("#burger"), navwrap = $("#navwrap");
  if (burger && navwrap) {
    var close = function () {
      navwrap.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "Open menu");
    };
    burger.addEventListener("click", function () {
      var open = navwrap.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    navwrap.addEventListener("click", function (e) { if (e.target.closest("a")) close(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && navwrap.classList.contains("open")) { close(); burger.focus(); }
    });
    window.addEventListener("resize", function () { if (window.innerWidth > 960) close(); });
  }

  /* Active section in the nav */
  var links = $$('.nav a[href^="#"]');
  if (links.length && HAS_IO) {
    var map = links.map(function (a) {
      var el = document.getElementById(a.getAttribute("href").slice(1));
      return el ? { a: a, el: el } : null;
    }).filter(Boolean);

    var nio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (l) { l.classList.remove("on"); });
        var hit = map.filter(function (m) { return m.el === e.target; })[0];
        if (hit) hit.a.classList.add("on");
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    map.forEach(function (m) { nio.observe(m.el); });
  }

  /* ---------------------------------------------- 5 · scroll progress line */
  var bar = $("#progress span");
  if (bar && !REDUCED) {
    var ticking = false;
    var paint = function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? Math.min(1, window.scrollY / h) : 0;
      bar.style.transform = "scaleX(" + p + ")";
      ticking = false;
    };
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(paint); }
    }, { passive: true });
    paint();
  }

  /* -------------------------------------------------- 6 · pointer accent */
  (function cursor() {
    if (REDUCED) return;
    if (!(window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches)) return;
    if (window.innerWidth < 1024) return;

    var ring = $("#cur"), dot = $("#curdot");
    if (!ring || !dot) return;
    document.documentElement.classList.add("cursor-on");

    var tx = -100, ty = -100, rx = -100, ry = -100, raf = null;

    function loop() {
      rx += (tx - rx) * 0.18;
      ry += (ty - ry) * 0.18;
      ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0)";
      dot.style.transform  = "translate3d(" + tx + "px," + ty + "px,0)";
      raf = requestAnimationFrame(loop);
    }
    document.addEventListener("mousemove", function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });

    var HOT = "a, button, [role=button], input, summary";
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest && e.target.closest(HOT)) ring.classList.add("hot");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest && e.target.closest(HOT)) ring.classList.remove("hot");
    });
    document.addEventListener("mouseleave", function () { ring.style.opacity = 0; dot.style.opacity = 0; });
    document.addEventListener("mouseenter", function () { ring.style.opacity = ""; dot.style.opacity = ""; });
  })();

  /* -------------------------------------------------- 7 · contact channels */
  (function contact() {
    var box = $("#chan");
    if (!box) return;
    var e = window.EMH.esc, rows = [];

    if (CFG.email) {
      rows.push('<a href="mailto:' + e(CFG.email) + '">' +
        '<span class="chan__k">Email</span>' +
        '<span class="chan__v">' + e(CFG.email) +
          '<small>Preferred for project enquiries and technical detail.</small></span>' +
        '<span class="chan__a" aria-hidden="true">→</span></a>');
    }
    if (CFG.whatsapp) {
      rows.push('<a href="https://wa.me/' + e(CFG.whatsapp) + '" target="_blank" rel="noopener noreferrer">' +
        '<span class="chan__k">WhatsApp</span>' +
        '<span class="chan__v">' + e(CFG.whatsappDisplay || CFG.whatsapp) +
          '<small>Direct message for quick technical discussion.</small></span>' +
        '<span class="chan__a" aria-hidden="true">→</span></a>');
    }
    rows.push('<a href="' + window.EMH.gh() + '" target="_blank" rel="noopener noreferrer">' +
      '<span class="chan__k">GitHub</span>' +
      '<span class="chan__v">@' + e(CFG.githubUsername) +
        '<small>Source code and engineering project repositories.</small></span>' +
      '<span class="chan__a" aria-hidden="true">→</span></a>');

    if (CFG.linkedinUrl) {
      rows.push('<a href="' + e(CFG.linkedinUrl) + '" target="_blank" rel="noopener noreferrer">' +
        '<span class="chan__k">LinkedIn</span>' +
        '<span class="chan__v">Professional profile<small>Professional network and background.</small></span>' +
        '<span class="chan__a" aria-hidden="true">→</span></a>');
    } else {
      rows.push('<div class="ch">' +
        '<span class="chan__k">LinkedIn</span>' +
        '<span class="chan__v" style="color:var(--tx-3)">Not published yet' +
          '<small>Set <code>linkedinUrl</code> in js/config.js to publish this link.</small></span>' +
        '<span class="chan__a" aria-hidden="true"></span></div>');
    }

    box.innerHTML = rows.join("");
  })();

  /* -------------------------------------------------------------- 8 · CV */
  (function cv() {
    var links = $$('[id^="cvDownload"]');
    var note  = $("#cvNote");
    if (!links.length || !CFG.cvPath) return;
    links.forEach(function (el) { el.setAttribute("href", CFG.cvPath); });
    if (!window.fetch) return;

    fetch(CFG.cvPath, { method: "HEAD" })
      .then(function (r) { if (!r.ok) throw new Error("missing"); })
      .catch(function () {
        links.forEach(function (el) {
          el.classList.remove("btn--fill");
          el.classList.add("btn--line");
          el.setAttribute("aria-disabled", "true");
        });
        if (note) {
          note.textContent = "PDF not uploaded yet — add " + CFG.cvPath + " and the button starts working.";
        }
      });
  })();

  /* ------------------------------------------------------------ 9 · misc */
  var y = $("#year");
  if (y) y.textContent = new Date().getFullYear();

  $$('[data-gh]').forEach(function (el) {
    el.setAttribute("href", window.EMH.gh());
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener noreferrer");
  });
})();
