/* ============================================================
   WEA — Members page
   Executive council profile cards (dialog) + filterable directory
   ============================================================ */
(function () {
  "use strict";

  var D = window.WEA_DATA;

  /* ================= stat strip ================= */

  function renderStats() {
    var el = document.getElementById("memberStats");
    if (!el) return;

    var s = WEA_STORE.stats();
    var cells = [
      { count: s.verified, suffix: "", label: "Verified members" },
      { count: s.countries, suffix: "", label: "Countries" },
      { count: s.council, suffix: "", label: "Executive council" },
      { count: s.pending, suffix: "", label: "In review" }
    ];

    el.innerHTML = cells
      .map(function (c) {
        return (
          '<div class="stat-cell">' +
          '<strong><span data-count="' + c.count + '">0</span>' + c.suffix + "</strong>" +
          "<span>" + WEA.escapeHTML(c.label) + "</span>" +
          "</div>"
        );
      })
      .join("");
  }

  /* ================= executive council ================= */

  function renderCouncil() {
    var grid = document.getElementById("councilGrid");
    if (!grid) return;

    grid.innerHTML = D.executives
      .map(function (m, i) {
        return (
          '<article class="profile-card reveal" style="--d:' + i * 70 + 'ms" ' +
          'data-exec="' + i + '" tabindex="0" role="button" ' +
          'aria-label="Open profile for ' + WEA.escapeHTML(m.name) + '">' +
          '<span class="profile-badge badge"><i class="ph ph-seal-check" aria-hidden="true"></i> Council</span>' +
          WEA.avatarHTML(m.name, null, "avatar--lg") +
          "<h3>" + WEA.escapeHTML(m.name) + "</h3>" +
          '<p class="profile-role">' + WEA.escapeHTML(m.title) + "</p>" +
          '<span class="profile-region badge"><i class="ph ph-map-pin" aria-hidden="true"></i> ' +
          WEA.escapeHTML(m.region) + "</span>" +
          '<span class="profile-more mono-label">Full profile ' +
          '<i class="ph ph-arrow-right" aria-hidden="true"></i></span>' +
          "</article>"
        );
      })
      .join("");

    var dialog = document.getElementById("profileDialog");
    var body = document.getElementById("dialogBody");
    var closeBtn = document.getElementById("dialogClose");
    var lastFocused = null;

    function openProfile(index, trigger) {
      var m = D.executives[index];
      if (!m || !dialog || !body) return;

      var bio = (m.bio || [])
        .map(function (p) { return "<p>" + WEA.escapeHTML(p) + "</p>"; })
        .join("");

      body.innerHTML =
        '<div class="dialog-head">' +
        WEA.avatarHTML(m.name, null, "avatar--xl") +
        "<div>" +
        "<h3>" + WEA.escapeHTML(m.name) + "</h3>" +
        '<p class="profile-role">' + WEA.escapeHTML(m.title) + "</p>" +
        '<div class="dialog-head-meta">' +
        '<span class="badge"><i class="ph ph-map-pin" aria-hidden="true"></i> ' +
        WEA.escapeHTML(m.region) + "</span>" +
        '<span class="badge badge--verified"><i class="ph ph-seal-check" aria-hidden="true"></i> Verified</span>' +
        "</div>" +
        "</div>" +
        "</div>" +
        '<div class="dialog-bio">' + bio + "</div>" +
        '<dl class="dialog-meta">' +
        "<div><dt>Committee</dt><dd>" + WEA.escapeHTML(m.committee || "—") + "</dd></div>" +
        "<div><dt>Member ID</dt><dd>" + WEA.escapeHTML(m.id) + "</dd></div>" +
        "<div><dt>Council since</dt><dd>" + WEA.formatDate(m.joined) + "</dd></div>" +
        "<div><dt>Focus</dt><dd>" + WEA.escapeHTML((m.focus || []).join(" · ") || "—") + "</dd></div>" +
        "</dl>" +
        '<div class="dialog-actions">' +
        '<a class="btn btn-primary" href="verify.html?id=' + encodeURIComponent(m.id) + '">' +
        '<i class="ph ph-seal-check" aria-hidden="true"></i> Verify this record</a>' +
        '<a class="btn btn-ghost" href="register.html">' +
        '<i class="ph ph-user-plus" aria-hidden="true"></i> Apply for membership</a>' +
        "</div>";

      /* remember what to return focus to when the dialog closes */
      lastFocused = trigger || document.activeElement;

      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
      /* move focus inside the dialog for keyboard users */
      if (closeBtn) closeBtn.focus();
    }

    function closeDialog() {
      if (typeof dialog.close === "function" && dialog.open) {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
      if (lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus();
      }
    }

    WEA.qsa("[data-exec]", grid).forEach(function (card) {
      card.addEventListener("click", function () {
        openProfile(Number(card.getAttribute("data-exec")), card);
      });
      card.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openProfile(Number(card.getAttribute("data-exec")), card);
        }
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", closeDialog);
    }
    if (dialog) {
      dialog.addEventListener("click", function (event) {
        if (event.target === dialog) closeDialog();
      });
      /* keep focus restore working when the dialog is dismissed with Esc */
      dialog.addEventListener("close", function () {
        if (lastFocused && typeof lastFocused.focus === "function") {
          lastFocused.focus();
        }
      });
    }
  }

  /* ================= directory ================= */

  function renderDirectory() {
    var list = document.getElementById("dirList");
    var empty = document.getElementById("dirEmpty");
    var count = document.getElementById("dirCount");
    var search = document.getElementById("dirSearch");
    var countrySel = document.getElementById("dirCountry");
    var tierSel = document.getElementById("dirTier");
    if (!list) return;

    var all = WEA_STORE.all();

    /* populate country filter */
    var seen = {};
    var countries = [];
    all.forEach(function (m) {
      if (m.country && !seen[m.country]) {
        seen[m.country] = true;
        countries.push(m.country);
      }
    });
    countries.sort();
    countries.forEach(function (c) {
      var opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      countrySel.appendChild(opt);
    });

    function apply() {
      var q = search.value.trim().toLowerCase();
      var country = countrySel.value;
      var tier = tierSel.value;

      var rows = all.filter(function (m) {
        if (country && m.country !== country) return false;
        if (tier && m.tier !== tier) return false;
        if (!q) return true;
        var haystack = [m.name, m.company, m.country, m.industry, m.role]
          .concat(m.socials ? Object.keys(m.socials).map(function (k) { return m.socials[k]; }) : [])
          .join(" ")
          .toLowerCase();
        return haystack.indexOf(q) !== -1;
      });

      /* verified first, then alphabetical */
      rows.sort(function (a, b) {
        var av = a.status === "verified" ? 0 : 1;
        var bv = b.status === "verified" ? 0 : 1;
        if (av !== bv) return av - bv;
        return String(a.name).localeCompare(String(b.name));
      });

      list.innerHTML = rows
        .map(function (m) {
          var verified = m.status === "verified";
          return (
            '<div class="dir-row">' +
            WEA.avatarHTML(m.name, null, "avatar--sm") +
            '<div class="dir-name">' +
            "<strong>" + WEA.escapeHTML(m.name) +
            (m.executive
              ? ' <span class="badge badge--verified"><i class="ph ph-seal-check" aria-hidden="true"></i> Council</span>'
              : "") +
            "</strong>" +
            "<span>" + WEA.escapeHTML(m.role || "Member") + " · " +
            WEA.escapeHTML(m.company || "—") + "</span>" +
            "</div>" +
            '<span class="dir-country"><i class="ph ph-map-pin" aria-hidden="true"></i> ' +
            WEA.escapeHTML(m.country || "—") + "</span>" +
            '<span class="badge ' + (verified ? "badge--verified" : "badge--pending") + '">' +
            (verified ? "Verified" : "Pending") + "</span>" +
            '<div class="dir-actions">' +
            WEA.socialsHTML(m, "social-row social-row--inline") +
            WEA.cvHTML(m, "CV") +
            '<a class="dir-view" href="verify.html?id=' + encodeURIComponent(m.id) + '">Verify</a>' +
            "</div>" +
            "</div>"
          );
        })
        .join("");

      if (count) {
        count.textContent = rows.length + (rows.length === 1 ? " member" : " members") +
          " shown" + (rows.length !== all.length ? " of " + all.length : "");
      }
      empty.hidden = rows.length > 0;
      list.hidden = rows.length === 0;
    }

    search.addEventListener("input", apply);
    countrySel.addEventListener("change", apply);
    tierSel.addEventListener("change", apply);
    apply();
  }

  renderStats();
  renderCouncil();
  renderDirectory();
  WEA.init();
})();
