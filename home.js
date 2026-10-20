/* ============================================================
   WEA — Home page rendering (tiers, leadership, FAQ, card preview)
   Loaded after data.js / store.js / script.js
   Emits the exact markup contract in styles.css.
   ============================================================ */
(function () {
  "use strict";

  var D = window.WEA_DATA;

  /* ---------- membership tier cards ---------- */

  function renderTiers() {
    var el = document.getElementById("tierGrid");
    if (!el) return;

    el.innerHTML = D.tiers
      .map(function (t) {
        return (
          '<article class="tier-card' + (t.featured ? " tier-card--featured" : "") + '">' +
          (t.featured
            ? '<span class="chip tier-flag"><i class="ph ph-star" aria-hidden="true"></i> Most chosen</span>'
            : "") +
          '<h3 class="tier-name">' + WEA.escapeHTML(t.name) + "</h3>" +
          '<p class="tier-for mono-label">' + WEA.escapeHTML(t.for) + "</p>" +
          '<p class="tier-price"><span class="cur">' + WEA.escapeHTML(t.price) + "</span>" +
          '<span class="per">' + WEA.escapeHTML(t.per) + "</span></p>" +
          '<ul class="tier-list">' +
          t.benefits
            .map(function (b) {
              return '<li><i class="ph ph-check-circle" aria-hidden="true"></i><span>' +
                WEA.escapeHTML(b) + "</span></li>";
            })
            .join("") +
          "</ul>" +
          '<a class="btn ' + (t.featured ? "btn-primary" : "btn-ghost") +
          '" href="register.html?tier=' + encodeURIComponent(t.slug) + '">' +
          "Become a member <i class=\"ph ph-arrow-right\" aria-hidden=\"true\"></i></a>" +
          "</article>"
        );
      })
      .join("");
  }

  /* ---------- leadership preview (first four council members) ---------- */

  function renderLeadership() {
    var el = document.getElementById("leadershipGrid");
    if (!el) return;

    el.innerHTML = D.executives
      .slice(0, 4)
      .map(function (m, i) {
        return (
          '<a class="profile-card reveal" style="--d:' + (i * 90 + 60) + 'ms" ' +
          'href="members.html#leadership">' +
          '<span class="profile-badge badge"><i class="ph ph-seal-check" aria-hidden="true"></i> Council</span>' +
          WEA.avatarHTML(m.name, null, "avatar--lg") +
          "<h3>" + WEA.escapeHTML(m.name) + "</h3>" +
          '<p class="profile-role">' + WEA.escapeHTML(m.title) + "</p>" +
          '<p class="profile-region mono-label">' + WEA.escapeHTML(m.region) + "</p>" +
          '<span class="profile-more mono-label">View profile <i class="ph ph-arrow-right" aria-hidden="true"></i></span>' +
          "</a>"
        );
      })
      .join("");
  }

  /* ---------- FAQ accordion ---------- */

  function renderFaq() {
    var el = document.getElementById("faqList");
    if (!el) return;

    el.innerHTML = D.faq
      .map(function (f, i) {
        return (
          '<article class="faq-item open">' +
          '<button class="faq-row" id="faq-b' + i + '" aria-expanded="true" ' +
          'aria-controls="faq-p' + i + '">' +
          "<h3>" + WEA.escapeHTML(f.q) + "</h3>" +
          '<i class="ph ph-plus" aria-hidden="true"></i>' +
          "</button>" +
          '<div class="faq-panel" id="faq-p' + i + '" role="region" aria-labelledby="faq-b' + i + '">' +
          "<div><p>" + WEA.escapeHTML(f.a) + "</p></div>" +
          "</div>" +
          "</article>"
        );
      })
      .join("");
  }

  /* ---------- ID card preview in the apply section ---------- */

  function renderCardPreview() {
    var el = document.getElementById("applyCardPreview");
    if (!el) return;

    var all = WEA_STORE.all();
    var sample = null;
    for (var i = 0; i < all.length; i++) {
      if (all[i].sample) { sample = all[i]; break; }
    }
    if (!sample) sample = all[0];
    if (sample) el.innerHTML = WEA.idCardHTML(sample);
  }

  /* ---------- events & news ---------- */

  var EVENT_TONE = {
    upcoming: "",
    new: "event-card--new",
    past: "event-card--past"
  };

  var EVENT_LABEL = {
    upcoming: "Upcoming",
    new: "New",
    past: "Past"
  };

  function eventCardHTML(e, i) {
    var when = WEA.eventDate(e.date);
    if (!when) return "";

    var tone = EVENT_TONE[e.status] || "";
    var label = EVENT_LABEL[e.status] || "Upcoming";
    var span = when.day + " " + when.month + " " + when.year;

    if (e.endDate) {
      var end = WEA.eventDate(e.endDate);
      if (end) span = when.day + "–" + end.day + " " + end.month + " " + end.year;
    }

    return (
      '<article class="event-card ' + tone + ' reveal" style="--d:' + (i * 70 + 60) + 'ms">' +
      '<div class="event-when">' +
      '<span class="event-day">' + WEA.escapeHTML(when.day) + "</span>" +
      '<span class="event-month mono-label">' + WEA.escapeHTML(when.month) + "</span>" +
      "</div>" +
      '<div class="event-body">' +
      '<p class="event-meta mono-label">' +
      '<span class="chip">' + WEA.escapeHTML(e.kind) + "</span>" +
      '<span class="event-status event-status--' + WEA.escapeHTML(e.status) + '">' +
      WEA.escapeHTML(label) + "</span>" +
      "</p>" +
      "<h3>" + WEA.escapeHTML(e.title) + "</h3>" +
      '<p class="event-where"><i class="ph ph-map-pin" aria-hidden="true"></i> ' +
      WEA.escapeHTML(e.location) + "</p>" +
      "<p>" + WEA.escapeHTML(e.summary) + "</p>" +
      '<p class="event-foot">' +
      '<span class="mono-label event-span">' + WEA.escapeHTML(span) + "</span>" +
      (e.href
        ? '<a class="link-gold" href="' + WEA.escapeHTML(e.href) + '">' +
          WEA.escapeHTML(e.cta || "Learn more") + ' <i class="ph ph-arrow-right" aria-hidden="true"></i></a>'
        : "") +
      "</p>" +
      "</div>" +
      "</article>"
    );
  }

  function renderEvents() {
    var el = document.getElementById("eventGrid");
    if (!el) return;

    var list = (D.events || []).slice();

    /* upcoming first, featured pinned to the top, past items last */
    list.sort(function (a, b) {
      var rank = function (e) {
        if (e.status === "past") return 2;
        return e.featured ? 0 : 1;
      };
      var ra = rank(a);
      var rb = rank(b);
      if (ra !== rb) return ra - rb;
      var da = WEA.eventDate(a.date);
      var db = WEA.eventDate(b.date);
      return (da ? da.time : 0) - (db ? db.time : 0);
    });

    el.innerHTML = list.map(eventCardHTML).join("");
  }

  renderTiers();
  renderEvents();
  renderLeadership();
  renderFaq();
  renderCardPreview();
  WEA.init();
})();
