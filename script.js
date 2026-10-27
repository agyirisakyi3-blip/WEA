/* ============================================================
   WEA — Shared site script (all pages)
   ============================================================ */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  var WEA = {
    qs: qs,
    qsa: qsa,
    reduceMotion: reduceMotion
  };

  /* ---------- sticky nav ---------- */

  var nav = qs(".nav");
  var sentinel = qs("#sentinel");

  if (nav && sentinel && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      nav.classList.toggle("scrolled", !entries[0].isIntersecting);
    }).observe(sentinel);
  } else if (nav) {
    nav.classList.add("scrolled");
  }

  /* ---------- mobile menu ---------- */

  var menuBtn = qs("#menuBtn");
  var mobileMenu = qs("#mobileMenu");

  function setMenu(open) {
    if (!mobileMenu || !menuBtn) return;
    mobileMenu.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("menu-open", open);
  }

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", function () {
      setMenu(!mobileMenu.classList.contains("open"));
    });
    qsa("a, button", mobileMenu).forEach(function (link) {
      link.addEventListener("click", function () {
        setMenu(false);
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && mobileMenu.classList.contains("open")) {
        setMenu(false);
        menuBtn.focus();
      }
    });
  }

  /* ---------- active nav link for the current page ---------- */

  var currentPage = document.body.getAttribute("data-nav");

  if (currentPage) {
    qsa("[data-nav]").forEach(function (el) {
      if (el.getAttribute("data-nav") === currentPage) {
        el.classList.add("is-current");
        if (el.classList.contains("nav-link")) el.classList.add("active");
      }
    });
  }

  /* ---------- scroll reveal ---------- */

  var revealObserver = null;

  function showAll() {
    qsa(".reveal").forEach(function (el) {
      el.classList.add("in");
    });
  }

  function initReveal() {
    var els = qsa(".reveal:not(.in)");
    if (!els.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      els.forEach(function (el) {
        el.classList.add("in");
      });
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("in");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -5% 0px" }
      );
    }
    els.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  initReveal();

  /* ---------- counters ---------- */

  function renderCounter(el, value) {
    el.textContent = String(value) + (el.dataset.suffix || "");
  }

  function animateCounter(el) {
    var target = parseInt(el.dataset.count, 10);
    if (isNaN(target)) return;
    if (reduceMotion) {
      renderCounter(el, target);
      return;
    }
    var duration = 1500;
    var start = null;
    function frame(ts) {
      if (start === null) start = ts;
      var t = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 4);
      renderCounter(el, Math.round(eased * target));
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function initCounters() {
    var counters = qsa("[data-count]:not([data-count-ready])");
    if (!counters.length) return;
    if ("IntersectionObserver" in window && !reduceMotion) {
      var counterObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              animateCounter(entry.target);
              counterObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.6 }
      );
      counters.forEach(function (el) {
        el.setAttribute("data-count-ready", "1");
        renderCounter(el, 0);
        counterObserver.observe(el);
      });
    } else {
      counters.forEach(function (el) {
        el.setAttribute("data-count-ready", "1");
        animateCounter(el);
      });
    }
  }

  initCounters();

  /* ---------- accordions (mission pillars + FAQ) ---------- */

  function initAccordions() {
    qsa(".pillar-item:not([data-bound])").forEach(function (item) {
      item.setAttribute("data-bound", "1");
      var btn = qs(".pillar-row", item);
      if (!btn) return;
      btn.addEventListener("click", function () {
        var isOpen = item.classList.contains("open");
        qsa(".pillar-item.open").forEach(function (other) {
          other.classList.remove("open");
          var otherBtn = qs(".pillar-row", other);
          if (otherBtn) otherBtn.setAttribute("aria-expanded", "false");
        });
        if (!isOpen) {
          item.classList.add("open");
          btn.setAttribute("aria-expanded", "true");
        }
      });
    });

    qsa(".faq-item:not([data-bound])").forEach(function (item) {
      item.setAttribute("data-bound", "1");
      var btn = qs(".faq-row", item);
      if (!btn) return;
      item.classList.add("open");
      btn.setAttribute("aria-expanded", "true");
      btn.addEventListener("click", function () {
        var isOpen = item.classList.contains("open");
        item.classList.toggle("open", !isOpen);
        btn.setAttribute("aria-expanded", String(!isOpen));
      });
    });
  }

  initAccordions();

  /* ---------- section scroll-spy (home page only) ---------- */

  if (currentPage === "home" && "IntersectionObserver" in window) {
    var navLinks = qsa(".nav-links a[href^='#']");
    var sections = qsa("main section[id]");
    if (navLinks.length && sections.length) {
      var linkObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            navLinks.forEach(function (link) {
              link.classList.toggle(
                "active",
                link.getAttribute("href") === "#" + entry.target.id
              );
            });
          });
        },
        { rootMargin: "-40% 0px -55% 0px" }
      );
      sections.forEach(function (section) {
        linkObserver.observe(section);
      });
    }
  }

  /* ---------- footer year ---------- */

  qsa("#year").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- toast ---------- */

  var toastEl = null;

  WEA.toast = function (message) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      toastEl.innerHTML =
        '<i class="ph ph-check-circle" aria-hidden="true"></i><span></span>';
      document.body.appendChild(toastEl);
    }
    toastEl.querySelector("span").textContent = message;
    toastEl.classList.add("show");
    window.clearTimeout(toastEl._timer);
    toastEl._timer = window.setTimeout(function () {
      toastEl.classList.remove("show");
    }, 2600);
  };

  /* ---------- clipboard ---------- */

  WEA.copy = function (text, btn) {
    function done() {
      WEA.toast("Copied to clipboard");
      if (btn) {
        var original = btn.innerHTML;
        btn.classList.add("done");
        btn.innerHTML =
          '<i class="ph ph-check" aria-hidden="true"></i> Copied';
        window.setTimeout(function () {
          btn.classList.remove("done");
          btn.innerHTML = original;
        }, 1800);
      }
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () {
        fallbackCopy(text, done);
      });
    } else {
      fallbackCopy(text, done);
    }
  };

  function fallbackCopy(text, done) {
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand("copy");
      done();
    } catch (err) {
      WEA.toast("Copy not supported in this browser");
    }
    document.body.removeChild(area);
  }

  /* ---------- data-initials avatars ---------- */

  WEA.initials = function (name) {
    var parts = String(name || "").replace(/[^\p{L}\s.'-]/gu, "").trim().split(/\s+/);
    var skip = { "mr": 1, "mrs": 1, "ms": 1, "dr": 1, "prof": 1, "amb": 1, "sir": 1, "madam": 1 };
    var words = parts.filter(function (p) {
      return p && !skip[p.toLowerCase().replace(/\./g, "")];
    });
    if (!words.length) words = parts;
    var first = words[0] ? words[0][0] : "W";
    var last = words.length > 1 ? words[words.length - 1][0] : "";
    return (first + last).toUpperCase();
  };

  WEA.avatarHTML = function (name, photo, sizeClass) {
    var cls = "avatar" + (sizeClass ? " " + sizeClass : "");
    var initials = WEA.initials(name);
    if (photo) {
      return (
        '<span class="' + cls + '"><img src="' + photo + '" alt="' +
        String(name).replace(/"/g, "&quot;") + '" loading="lazy" /></span>'
      );
    }
    return '<span class="' + cls + '" aria-hidden="true">' + initials + "</span>";
  };

  /* ---------- date formatting ---------- */

  WEA.formatDate = function (iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  WEA.validThrough = function (iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    d.setFullYear(d.getFullYear() + 1);
    var mm = String(d.getMonth() + 1).padStart(2, "0");
    return mm + "/" + d.getFullYear();
  };

  /* Split an ISO date into the parts an event chip needs. Returns null
     for missing or malformed input so callers can fall back safely.
     Read via UTC: event dates are calendar dates with no time, so
     local getters would shift the day west of UTC. */
  WEA.eventDate = function (iso) {
    if (!iso) return null;
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso).trim());
    if (!m) return null;
    var y = Number(m[1]);
    var mo = Number(m[2]) - 1;
    var day = Number(m[3]);
    if (mo < 0 || mo > 11 || day < 1 || day > 31) return null;
    var d = new Date(Date.UTC(y, mo, day));
    if (d.getUTCFullYear() !== y || d.getUTCMonth() !== mo || d.getUTCDate() !== day) return null;
    var months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN",
      "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return {
      day: String(day).padStart(2, "0"),
      month: months[mo],
      year: String(y),
      time: d.getTime()
    };
  };

  /* ---------- id card renderer ---------- */

  /* Absolute verify URL for QR codes and share links. Falls back to a
     relative path when the site is opened straight from disk. */
  WEA.verifyUrl = function (memberId) {
    var base =
      (typeof window !== "undefined" && window.WEA_DATA && window.WEA_DATA.site && window.WEA_DATA.site.baseUrl
        ? window.WEA_DATA.site.baseUrl
        : ""
      ).replace(/\/$/, "");
    return base + "/verify.html?id=" + encodeURIComponent(memberId);
  };

  WEA.qrHTML = function (text, size, label) {
    if (typeof window.WEA_QR !== "object" || !window.WEA_QR) return "";
    var svg = window.WEA_QR.svg(text, { size: size || 96, margin: 1, dark: "#111a2b", light: "#ffffff" });
    if (!svg) return "";
    return '<span class="id-qr"' + (label ? ' role="img" aria-label="' + escapeHTML(label) + '"' : "") + ">" + svg + "</span>";
  };

  WEA.idCardHTML = function (member) {
    var name = member.name || "WEA Member";
    var tier = WEA_STORE.tierName(member.tier || "associate");
    var status = member.status === "verified" ? "verified" : "pending";
    var badge =
      status === "verified"
        ? '<span class="badge badge--verified"><i class="ph ph-seal-check" aria-hidden="true"></i> Verified</span>'
        : '<span class="badge badge--pending"><i class="ph ph-hourglass-medium" aria-hidden="true"></i> Pending</span>';
    var role = member.role || "Member";
    var org = member.company && member.company !== "World Entrepreneurs Association"
      ? " · " + member.company
      : "";

    var verifyUrl = WEA.verifyUrl(member.id);
    var qr = WEA.qrHTML(verifyUrl, 96, "QR code linking to the verification page for " + name);

    return (
      '<div class="id-card" role="img" aria-label="WEA digital membership card for ' +
      String(name).replace(/"/g, "&quot;") + '">' +
      '<div class="id-top">' +
      '<span class="id-brand">' +
      '<svg class="brand-mark" viewBox="0 0 44 44" fill="none" aria-hidden="true">' +
      '<path d="M5 33.5 13.75 10.5 22 26.25 30.25 10.5 39 33.5" stroke="currentColor" stroke-width="3" stroke-linejoin="miter" stroke-linecap="square"/>' +
      '<rect x="33" y="4" width="7" height="7" fill="#1F45C9"/>' +
      "</svg>" +
      "<span><strong>WEA</strong><small>World Entrepreneurs Assoc.</small></span>" +
      "</span>" +
      badge +
      "</div>" +
      '<div class="id-mid">' +
      WEA.avatarHTML(name, member.photo) +
      "<span>" +
      '<span class="id-name">' + escapeHTML(name) + "</span>" +
      '<span class="id-role">' + escapeHTML(role) + escapeHTML(org) + "</span>" +
      "</span>" +
      "</div>" +
      '<dl class="id-grid">' +
      "<div><dt>Member ID</dt><dd>" + escapeHTML(member.id) + "</dd></div>" +
      "<div><dt>Class</dt><dd>" + escapeHTML(tier) + "</dd></div>" +
      "<div><dt>Valid through</dt><dd>" + WEA.validThrough(member.joined) + "</dd></div>" +
      "</dl>" +
      '<div class="id-bottom">' +
      '<span class="id-barcode" aria-hidden="true"></span>' +
      '<span class="id-verify-url">Verify at verify.html?id=' + escapeHTML(member.id) + "</span>" +
      (qr ? '<span class="id-qr-wrap">' + qr + '<span class="id-qr-cap">Scan to verify</span></span>' : "") +
      "</div>" +
      "</div>"
    );
  };

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  WEA.escapeHTML = escapeHTML;

  /* ---------- social handles ---------- */

  /* Renders a member's social handles as a row of icon links. External
     links always carry rel="noopener" and an aria-label naming the
     platform, since the icon alone is not an accessible name.
     Returns "" when the member has none — callers can drop it in
     unconditionally. */
  WEA.socialsHTML = function (member, className) {
    if (!member || !member.socials) return "";
    var platforms = (window.WEA_DATA && window.WEA_DATA.socials) || [];
    var links = [];

    platforms.forEach(function (p) {
      var handle = member.socials[p.key];
      if (!handle) return;
      var url = WEA_STORE.socialUrl(p.key, handle);
      if (!url) return;
      links.push(
        '<a class="social-link" href="' + escapeHTML(url) + '" ' +
        'target="_blank" rel="noopener noreferrer" ' +
        'title="' + escapeHTML(p.label + " · " + handle) + '" ' +
        'aria-label="' + escapeHTML(member.name + " on " + p.label) + '">' +
        '<i class="ph ' + escapeHTML(p.icon) + '" aria-hidden="true"></i>' +
        "</a>"
      );
    });

    if (!links.length) return "";
    return '<div class="' + escapeHTML(className || "social-row") + '">' + links.join("") + "</div>";
  };

  /* ---------- CV ---------- */

  /* A compact chip showing that a CV is on file, with a download link.
     Returns "" when there is no CV. */
  WEA.cvHTML = function (member, label) {
    if (!member || !window.WEA_STORE || !WEA_STORE.hasCv(member)) return "";
    var name = member.cv.name || "CV.pdf";
    return (
      '<a class="cv-chip" href="' + escapeHTML(WEA_STORE.cvDownloadHref(member)) + '" ' +
      'download="' + escapeHTML(name) + '">' +
      '<i class="ph ph-file-pdf" aria-hidden="true"></i>' +
      "<span>" + escapeHTML(label || "CV on file") + "</span>" +
      '<span class="cv-chip-size mono-label">' + escapeHTML(WEA_STORE.formatBytes(member.cv.size)) + "</span>" +
      '<i class="ph ph-download-simple cv-chip-dl" aria-hidden="true"></i>' +
      "</a>"
    );
  };

  /* ---------- print member card ---------- */

  WEA.printCard = function () {
    document.body.classList.add("print-card");
    window.setTimeout(function () {
      window.print();
      window.setTimeout(function () {
        document.body.classList.remove("print-card");
      }, 400);
    }, 60);
  };

  /* ---------- re-init hooks for dynamically rendered content ---------- */

  WEA.initReveal = initReveal;
  WEA.initAccordions = initAccordions;
  WEA.initCounters = initCounters;
  WEA.init = function () {
    initReveal();
    initAccordions();
    initCounters();
  };

  window.WEA = WEA;
})();
