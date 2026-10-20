/* ============================================================
   WEA — Member verification
   Look up a record by member ID or verification code.
   Deep link: verify.html?id=WEA-YYYY-NNNNNN
   ============================================================ */
(function () {
  "use strict";

  var input = document.getElementById("verifyInput");
  var btn = document.getElementById("verifyBtn");
  if (!input || !btn) return;

  var idle = document.getElementById("resultIdle");
  var box = document.getElementById("resultBox");
  var fail = document.getElementById("resultFail");
  var head = document.getElementById("resultHead");
  var meta = document.getElementById("resultMeta");
  var card = document.getElementById("resultCard");
  var actions = document.getElementById("resultActions");

  var lastMember = null;
  var lastQuery = "";

  function showView(view) {
    idle.classList.toggle("show", view === "idle");
    box.classList.toggle("show", view === "result");
    fail.classList.toggle("show", view === "fail");
  }

  function metaRow(label, value, href) {
    var inner = href
      ? '<a class="link-gold" href="' + href + '">' + WEA.escapeHTML(value) + "</a>"
      : WEA.escapeHTML(value);
    return "<div><dt>" + WEA.escapeHTML(label) + "</dt><dd>" + inner + "</dd></div>";
  }

  function lookup(raw) {
    var query = String(raw || "").trim();
    if (!query) {
      showView("idle");
      WEA.toast("Enter a member ID or verification code.");
      return;
    }

    lastQuery = query;
    var member = WEA_STORE.find(query);

    if (!member) {
      showView("fail");
      return;
    }

    lastMember = member;

    var verified = member.status === "verified";
    var state = WEA_STORE.membershipState(member);

    head.innerHTML =
      '<div class="result-head ' + (verified ? "result-head--ok" : "result-head--pending") + '">' +
      '<span class="result-icon"><i class="ph ' +
      (verified ? "ph-seal-check" : "ph-hourglass-medium") + '" aria-hidden="true"></i></span>' +
      "<div>" +
      "<h2>" + WEA.escapeHTML(member.name) + "</h2>" +
      "<p>" + WEA.escapeHTML(member.role || "Member") +
      (member.company && member.company !== "World Entrepreneurs Association"
        ? " · " + WEA.escapeHTML(member.company)
        : "") +
      "</p>" +
      "</div>" +
      '<span class="badge ' + (verified ? "badge--verified" : "badge--pending") + '">' +
      '<i class="ph ' + (verified ? "ph-seal-check" : "ph-hourglass-medium") + '" aria-hidden="true"></i> ' +
      (verified ? "Verified" : "Pending") +
      "</span>" +
      "</div>";

    var rows = [
      ["Member ID", member.id],
      ["Class", WEA_STORE.tierName(member.tier)],
      ["Country", member.country || "—"],
      ["Member since", WEA.formatDate(member.joined)],
      ["Valid through", WEA.validThrough(member.joined)]
    ];
    if (member.industry) rows.push(["Industry", member.industry]);
    if (verified) rows.push(["Standing", state.label]);

    meta.innerHTML = rows
      .map(function (r) { return metaRow(r[0], r[1]); })
      .join("");

    /* renewal / expiry notice — surfaced publicly so anyone checking a
       record sees the true standing, not just "verified" */
    if (verified && (state.status === "expired" || state.status === "expiring")) {
      meta.innerHTML +=
        '<div class="result-notice result-notice--' +
        (state.status === "expired" ? "bad" : "warn") + '">' +
        '<i class="ph ' + (state.status === "expired" ? "ph-warning-circle" : "ph-clock-countdown") +
        '" aria-hidden="true"></i> ' +
        (state.status === "expired"
          ? "<span>This membership has lapsed. Renewal is required to restore good standing.</span>"
          : "<span>Renewal is due within " + state.days + " days.</span>") +
        "</div>";
    }

    card.innerHTML = WEA.idCardHTML(member);

    actions.innerHTML =
      (verified
        ? '<a class="btn btn-primary" href="index.html">' +
          '<i class="ph ph-check-circle" aria-hidden="true"></i> Confirm via WhatsApp</a>'
        : '<a class="btn btn-primary" href="register.html">' +
          '<i class="ph ph-user-plus" aria-hidden="true"></i> Complete your application</a>') +
      '<button class="btn btn-ghost" type="button" onclick="WEA.printCard()">' +
      '<i class="ph ph-printer" aria-hidden="true"></i> Print ID</button>' +
      '<button class="btn btn-ghost" type="button" id="copyLinkBtn">' +
      '<i class="ph ph-link" aria-hidden="true"></i> Copy verification link</button>';

    var waBtn = actions.querySelector("a.btn-primary");
    if (waBtn && verified) {
      var text = "Hello WEA Secretariat — I have verified member " + member.name +
        " (" + member.id + ") on the WEA verification portal.";
      waBtn.href = "https://wa.me/233533507112?text=" + encodeURIComponent(text);
      waBtn.target = "_blank";
      waBtn.rel = "noopener";
    }

    bindCopy();
    showView("result");
  }

  function bindCopy() {
    var copyBtn = document.getElementById("copyLinkBtn");
    if (!copyBtn || !lastMember) return;
    copyBtn.addEventListener("click", function () {
      WEA.copy(WEA.verifyUrl(lastMember.id), copyBtn);
    });
  }

  /* ---------- events ---------- */

  btn.addEventListener("click", function () {
    lookup(input.value);
  });

  input.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      lookup(input.value);
    }
  });

  WEA.qsa("[data-demo]").forEach(function (chip) {
    chip.addEventListener("click", function () {
      input.value = chip.getAttribute("data-demo");
      lookup(input.value);
    });
  });

  /* ---------- deep link ---------- */

  var params = new URLSearchParams(window.location.search);
  var deep = params.get("id") || params.get("code") || "";
  if (deep) {
    input.value = deep;
    lookup(deep);
  } else {
    showView("idle");
  }

  WEA.init();
})();
