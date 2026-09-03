/* ==========================================================================
   main.js — navigation, configuration binding, contact rendering, reveals
   No dependencies. Fails soft: if anything here throws, the page still reads.
   ========================================================================== */
(function () {
  "use strict";

  var CFG = window.SITE_CONFIG || {};
  var $  = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------------------------------------------------------------------
     Small helpers shared with github.js
     --------------------------------------------------------------------- */
  window.PortfolioUtils = {
    escapeHtml: function (value) {
      return String(value == null ? "" : value)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    },
    formatDate: function (iso) {
      if (!iso) return "—";
      var d = new Date(iso);
      if (isNaN(d.getTime())) return "—";
      try {
        return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
      } catch (e) {
        return d.toISOString().slice(0, 10);
      }
    },
    githubProfileUrl: function () {
      return "https://github.com/" + encodeURIComponent(CFG.githubUsername || "");
    }
  };

  /* ---------------------------------------------------------------------
     Current year
     --------------------------------------------------------------------- */
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------------------
     Bind configured GitHub links
     --------------------------------------------------------------------- */
  $$('[data-config="githubProfile"]').forEach(function (el) {
    el.setAttribute("href", window.PortfolioUtils.githubProfileUrl());
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener noreferrer");
  });

  /* ---------------------------------------------------------------------
     Mobile navigation
     --------------------------------------------------------------------- */
  var toggle = $("#navToggle");
  var menu   = $("#navMenu");

  if (toggle && menu) {
    var closeMenu = function () {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation menu");
    };
    var openMenu = function () {
      menu.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close navigation menu");
    };

    toggle.addEventListener("click", function () {
      if (menu.classList.contains("is-open")) { closeMenu(); } else { openMenu(); }
    });

    menu.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeMenu();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && menu.classList.contains("is-open")) {
        closeMenu();
        toggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 940) closeMenu();
    });
  }

  /* ---------------------------------------------------------------------
     Sticky header shadow
     --------------------------------------------------------------------- */
  var header = $("#siteHeader");
  if (header) {
    var updateHeader = function () {
      header.classList.toggle("is-stuck", window.scrollY > 8);
    };
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
  }

  /* ---------------------------------------------------------------------
     Active section highlighting in the navigation
     --------------------------------------------------------------------- */
  var navLinks = $$('.nav__link[href^="#"]');
  var sections = navLinks
    .map(function (link) {
      var id = link.getAttribute("href").slice(1);
      var el = id ? document.getElementById(id) : null;
      return el ? { link: link, el: el } : null;
    })
    .filter(Boolean);

  if (sections.length && "IntersectionObserver" in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (l) { l.classList.remove("is-active"); });
        var match = sections.filter(function (s) { return s.el === entry.target; })[0];
        if (match) match.link.classList.add("is-active");
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });

    sections.forEach(function (s) { sectionObserver.observe(s.el); });
  }

  /* ---------------------------------------------------------------------
     Subtle reveal on scroll — respects prefers-reduced-motion
     --------------------------------------------------------------------- */
  var prefersReduced = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var revealables = $$(".reveal");
  if (prefersReduced || !("IntersectionObserver" in window)) {
    revealables.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });

    revealables.forEach(function (el) { revealObserver.observe(el); });
  }

  // Anything still hidden after load (e.g. observer never fired) is shown.
  window.addEventListener("load", function () {
    setTimeout(function () {
      $$(".reveal:not(.is-visible)").forEach(function (el) {
        var box = el.getBoundingClientRect();
        if (box.top < window.innerHeight) el.classList.add("is-visible");
      });
    }, 400);
  });

  /* ---------------------------------------------------------------------
     Contact cards, rendered from SITE_CONFIG
     --------------------------------------------------------------------- */
  var contactGrid = $("#contactGrid");
  if (contactGrid) {
    var esc = window.PortfolioUtils.escapeHtml;
    var cards = [];

    if (CFG.email) {
      cards.push(
        '<div class="contact-card">' +
          '<span class="contact-card__label">Email</span>' +
          '<a class="contact-card__value" href="mailto:' + esc(CFG.email) + '">' + esc(CFG.email) + "</a>" +
          '<p class="contact-card__note">Preferred for project enquiries and technical detail.</p>' +
          '<a class="btn btn--primary btn--sm" href="mailto:' + esc(CFG.email) + '">Send Email</a>' +
        "</div>"
      );
    }

    if (CFG.whatsapp) {
      cards.push(
        '<div class="contact-card">' +
          '<span class="contact-card__label">WhatsApp</span>' +
          '<span class="contact-card__value">' + esc(CFG.whatsappDisplay || CFG.whatsapp) + "</span>" +
          '<p class="contact-card__note">Direct message for quick technical discussion.</p>' +
          '<a class="btn btn--ghost-invert btn--sm" href="https://wa.me/' + esc(CFG.whatsapp) +
            '" target="_blank" rel="noopener noreferrer">WhatsApp</a>' +
        "</div>"
      );
    }

    cards.push(
      '<div class="contact-card">' +
        '<span class="contact-card__label">GitHub</span>' +
        '<a class="contact-card__value" href="' + window.PortfolioUtils.githubProfileUrl() +
          '" target="_blank" rel="noopener noreferrer">@' + esc(CFG.githubUsername) + "</a>" +
        '<p class="contact-card__note">Source code and engineering project repositories.</p>' +
        '<a class="btn btn--ghost-invert btn--sm" href="' + window.PortfolioUtils.githubProfileUrl() +
          '" target="_blank" rel="noopener noreferrer">View GitHub</a>' +
      "</div>"
    );

    if (CFG.linkedinUrl) {
      cards.push(
        '<div class="contact-card">' +
          '<span class="contact-card__label">LinkedIn</span>' +
          '<a class="contact-card__value" href="' + esc(CFG.linkedinUrl) +
            '" target="_blank" rel="noopener noreferrer">Professional profile</a>' +
          '<p class="contact-card__note">Professional network and background.</p>' +
          '<a class="btn btn--ghost-invert btn--sm" href="' + esc(CFG.linkedinUrl) +
            '" target="_blank" rel="noopener noreferrer">View LinkedIn</a>' +
        "</div>"
      );
    } else {
      cards.push(
        '<div class="contact-card">' +
          '<span class="contact-card__label">LinkedIn</span>' +
          '<span class="contact-card__value" style="color:var(--ink-invert-muted)">Not published yet</span>' +
          '<p class="contact-card__note">Set <code>linkedinUrl</code> in <code>js/config.js</code> to publish this link.</p>' +
        "</div>"
      );
    }

    contactGrid.innerHTML = cards.join("");
  }

  /* ---------------------------------------------------------------------
     CV download — point at the configured path, and say so honestly if the
     file has not been added to the repository yet.
     --------------------------------------------------------------------- */
  var cvLinks = $$('[id^="cvDownload"]');
  var cvNote  = $("#cvNote");
  if (cvLinks.length && CFG.cvPath) {
    cvLinks.forEach(function (el) { el.setAttribute("href", CFG.cvPath); });
    if (window.fetch) {
      fetch(CFG.cvPath, { method: "HEAD" })
        .then(function (res) {
          if (res.ok) return;
          throw new Error("missing");
        })
        .catch(function () {
          cvLinks.forEach(function (el) {
            el.classList.add("btn--outline");
            el.classList.remove("btn--primary");
            el.setAttribute("aria-disabled", "true");
          });
          if (cvNote) {
            cvNote.textContent =
              "PDF not uploaded yet. Add the file at " + CFG.cvPath +
              " and these buttons start working — no other change is needed.";
          }
        });
    }
  }
})();
