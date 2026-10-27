/* ============================================================
   WEA — Marketing portal
   Gate (member ID / verification code) + brand, campaigns,
   ambassadors and toolkit tabs.
   Deep links: portal.html#brand | #campaigns | #ambassadors | #toolkit
   ============================================================ */
(function () {
  "use strict";

  var D = window.WEA_DATA;

  var gate = document.getElementById("gate");
  var gateForm = document.getElementById("gateForm");
  var gateInput = document.getElementById("gateInput");
  var gateError = document.getElementById("gateError");
  var portal = document.getElementById("portal");
  if (!gateForm || !portal) return;
  var SESSION_KEY = "wea.portal.member";
  var member = null;

  /* ================= gate ================= */

  function showGateError(message) {
    gateError.textContent = message;
    gateError.hidden = false;
    gateInput.setAttribute("aria-invalid", "true");
  }

  function clearGateError() {
    gateError.hidden = true;
    gateError.textContent = "";
    gateInput.setAttribute("aria-invalid", "false");
  }

  function unlock(raw) {
    var query = String(raw || "").trim();
    if (!query) {
      showGateError("Enter your member ID or verification code.");
      gateInput.focus();
      return;
    }

    var found = WEA_STORE.find(query);
    if (!found) {
      showGateError("No WEA record matches that ID or code. Check it and try again.");
      gateInput.focus();
      return;
    }

    member = found;
    try {
      window.sessionStorage.setItem(SESSION_KEY, member.id);
    } catch (err) {
      /* storage unavailable — session-only access */
    }
    clearGateError();
    enterPortal();
  }

  gateForm.addEventListener("submit", function (event) {
    event.preventDefault();
    unlock(gateInput.value);
  });

  gateInput.addEventListener("input", clearGateError);

  function rememberedId() {
    try {
      return window.sessionStorage.getItem(SESSION_KEY);
    } catch (err) {
      return null;
    }
  }

  document.getElementById("lockPortal").addEventListener("click", function () {
    try {
      window.sessionStorage.removeItem(SESSION_KEY);
    } catch (err) {
      /* ignore */
    }
    member = null;
    portal.hidden = true;
    gate.hidden = false;
    gateInput.value = "";
    clearGateError();
    WEA.toast("Portal locked.");
  });

  /* ================= enter portal ================= */

  function enterPortal() {
    gate.hidden = true;
    portal.hidden = false;

    var verified = member.status === "verified";
    var banner = document.getElementById("portalBanner");
    banner.classList.toggle("portal-banner--pending", !verified);

    document.getElementById("bannerAvatar").textContent = WEA.initials(member.name);
    document.getElementById("bannerName").textContent = member.name;
    document.getElementById("bannerMeta").textContent =
      (verified ? "Verified member" : "Preview access — pending review") +
      " · " + WEA_STORE.tierName(member.tier) + " · " + member.id;

    var verifyHref = document.getElementById("bannerVerify");
    verifyHref.href = "verify.html?id=" + encodeURIComponent(member.id);

    renderDashboard(verified);
    renderSwatches();
    renderTemplates();
    renderHashtags();
    renderReferral(verified);
    renderRewards();
    renderToolkit();

    if (!portal.dataset.ready) {
      portal.dataset.ready = "1";
      bindTabs();
    }

    activateTab(tabFromHash() || "membership");
    scrollToHashSection();
    WEA.init();
  }

  /* ================= tabs ================= */

  var TABS = ["membership", "brand", "campaigns", "ambassadors", "toolkit"];

  function tabFromHash() {
    var name = window.location.hash.replace("#", "");
    return TABS.indexOf(name) === -1 ? null : name;
  }

  /* Scroll to the deep-linked section once its tab is visible. The browser
     cannot do this on load because #portal is hidden at parse time. */
  function scrollToHashSection() {
    var name = tabFromHash();
    if (!name) return;
    var target = document.getElementById(name);
    if (!target) return;
    window.requestAnimationFrame(function () {
      target.scrollIntoView({
        behavior: WEA.reduceMotion ? "auto" : "smooth",
        block: "start"
      });
    });
  }

  function activateTab(name) {
    WEA.qsa(".tab-btn", portal).forEach(function (btn) {
      var active = btn.getAttribute("data-tab") === name;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
    WEA.qsa(".tab-panel", portal).forEach(function (panel) {
      panel.classList.toggle("active", panel.id === "tab-" + name);
    });
  }

  function bindTabs() {
    WEA.qsa(".tab-btn", portal).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var name = btn.getAttribute("data-tab");
        activateTab(name);
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, "", "#" + name);
        }
      });
    });
  }

  window.addEventListener("hashchange", function () {
    if (portal.hidden) return;
    var name = tabFromHash();
    if (name) {
      activateTab(name);
      scrollToHashSection();
    }
  });

  /* ================= my membership (dashboard) ================= */

  function daysLabel(days) {
    if (days > 365) return Math.round(days / 365) + " year" + (Math.round(days / 365) === 1 ? "" : "s");
    if (days > 60) return Math.round(days / 30) + " months";
    if (days > 1) return days + " days";
    if (days === 1) return "1 day";
    return "today";
  }

  function renderDashboard(verified) {
    var card = document.getElementById("dashCard");
    var statusEl = document.getElementById("dashStatus");
    var metrics = document.getElementById("dashMetrics");
    var checklist = document.getElementById("dashChecklist");

    if (card) {
      card.innerHTML = WEA.idCardHTML(member) +
        WEA.cvHTML(member, "Download my CV") +
        WEA.socialsHTML(member, "social-row social-row--card");
    }

    /* ---------- status ---------- */
    var state = WEA_STORE.membershipState(member);
    if (statusEl) {
      var tone = state.status === "active" ? "is-good"
        : state.status === "expired" ? "is-bad"
        : "is-warn";
      statusEl.innerHTML =
        '<span class="status-pill ' + tone + '">' +
        '<i class="ph ' + (state.status === "active" ? "ph-check-circle"
          : state.status === "expired" ? "ph-warning-circle" : "ph-hourglass-medium") +
        '" aria-hidden="true"></i> ' + WEA.escapeHTML(state.label) + "</span>" +
        (state.expires
          ? "<p>Renews " + WEA.formatDate(state.expires.toISOString().slice(0, 10)) +
            (state.expired ? " — please contact the Secretariat." : " · " + daysLabel(state.days) + " remaining.") + "</p>"
          : "<p>Your record is with the Secretariat. Verification typically completes within five working days.</p>");
    }

    /* ---------- referral metrics ---------- */
    var refs = WEA_STORE.referralStats(member);
    if (metrics) {
      metrics.innerHTML =
        '<h3 class="mono-label" style="margin-bottom:1rem">Ambassador activity</h3>' +
        '<div class="metric-row">' +
        metric("Introduced", refs.total) +
        metric("Verified", refs.verified) +
        metric("In review", refs.pending) +
        "</div>" +
        (refs.total
          ? '<ul class="mini-list">' + refs.list.map(function (r) {
              return "<li><span>" + WEA.escapeHTML(r.name) + "</span>" +
                '<span class="chip">' + (r.status === "verified" ? "Verified" : "In review") + "</span></li>";
            }).join("") + "</ul>"
          : '<p class="dash-empty">No referrals yet. Share your link from the <strong>Ambassadors</strong> tab to start building your roll of honour.</p>');
    }

    /* ---------- profile completeness ---------- */
    if (checklist) {
      /* A venture name only applies to a member who runs one — the
         Secretariat's own officers carry the association's name. Counting
         it for them would make a complete profile unreachable. */
      var runsVenture = member.company && member.company !== "World Entrepreneurs Association";

      var required = [
        ["Your role", !!member.role],
        ["Country", !!member.country],
        ["City", !!member.city],
        ["Phone", !!member.phone],
        ["Industry", !!member.industry]
      ];
      if (runsVenture) required.unshift(["Venture name", true]);

      /* Optional extras, shown but not scored against the required set. */
      var optional = [
        ["Website", !!member.website],
        ["Social handle", !!(member.socials && Object.keys(member.socials).length)],
        ["CV on file", WEA_STORE.hasCv(member)]
      ];

      var done = required.filter(function (f) { return f[1]; }).length;
      var pct = Math.round((done / required.length) * 100);

      function row(f) {
        return "<li><span>" + WEA.escapeHTML(f[0]) + "</span>" +
          '<i class="ph ' + (f[1] ? "ph-check-circle is-good" : "ph-circle is-dim") +
          '" aria-hidden="true"></i></li>';
      }

      checklist.innerHTML =
        '<h3 class="mono-label" style="margin-bottom:1rem">Profile ' + pct + "% complete</h3>" +
        '<div class="meter" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100">' +
        '<span style="width:' + pct + '%"></span></div>' +
        '<ul class="mini-list">' + required.map(row).join("") + "</ul>" +
        '<h3 class="mono-label" style="margin:1.4rem 0 1rem">Optional — helps you get found</h3>' +
        '<ul class="mini-list">' + optional.map(row).join("") + "</ul>";
    }

    fillDashForm();
    bindDashActions();
  }

  function metric(label, value) {
    return '<div class="metric"><strong>' + value + "</strong><span>" + WEA.escapeHTML(label) + "</span></div>";
  }

  function fillDashForm() {
    var map = {
      dashName: "name",
      dashPhone: "phone",
      dashCity: "city",
      dashCompany: "company",
      dashRole: "role",
      dashIndustry: "industry",
      dashWebsite: "website"
    };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = member[map[id]] || "";
    });
    renderSocialFields();
    renderCvSlot();
  }

  /* ---------- social handle fields ---------- */

  function renderSocialFields() {
    var wrap = document.getElementById("dashSocials");
    if (!wrap) return;
    var platforms = (D.socials || []);
    var current = member.socials || {};

    wrap.innerHTML = platforms
      .map(function (p) {
        return (
          '<div class="field">' +
          '<label for="social-' + WEA.escapeHTML(p.key) + '">' +
          '<i class="ph ' + WEA.escapeHTML(p.icon) + '" aria-hidden="true"></i> ' +
          WEA.escapeHTML(p.label) + "</label>" +
          '<input type="text" id="social-' + WEA.escapeHTML(p.key) + '" ' +
          'data-social="' + WEA.escapeHTML(p.key) + '" ' +
          'placeholder="' + WEA.escapeHTML(p.placeholder) + '" ' +
          'value="' + WEA.escapeHTML(current[p.key] || "") + '" />' +
          "</div>"
        );
      })
      .join("");
  }

  function readSocials() {
    var out = {};
    WEA.qsa("[data-social]", document.getElementById("dashSocials") || document).forEach(function (input) {
      var key = input.getAttribute("data-social");
      var handle = WEA_STORE.normaliseHandle(input.value);
      if (!handle) return;
      if (!WEA_STORE.validHandle(key, handle)) {
        input.dataset.errorMsg = "That does not look like a valid " +
          (WEA_STORE.socialPlatform(key) ? WEA_STORE.socialPlatform(key).label : key) + " handle.";
        out.__invalid = true;
        return;
      }
      out[key] = handle;
    });
    return out;
  }

  /* ---------- CV slot ---------- */

  var pendingCv = null; /* chosen but not yet saved */
  var removeCv = false; /* marked for deletion on next save */

  function renderCvSlot() {
    var slot = document.getElementById("cvSlot");
    var pick = document.getElementById("cvPickLabel");
    var remove = document.getElementById("cvRemove");
    if (!slot) return;

    var limit = document.getElementById("cvLimit");
    if (limit) limit.textContent = WEA_STORE.formatBytes(WEA_STORE.cvMaxBytes);

    var shown = pendingCv || (!removeCv && WEA_STORE.hasCv(member) ? member.cv : null);

    if (shown) {
      slot.innerHTML =
        '<span class="cv-chip is-static">' +
        '<i class="ph ph-file-pdf" aria-hidden="true"></i>' +
        "<span>" + WEA.escapeHTML(shown.name) + "</span>" +
        '<span class="cv-chip-size mono-label">' + WEA.escapeHTML(WEA_STORE.formatBytes(shown.size)) + "</span>" +
        "</span>";
      if (pick) pick.textContent = pendingCv ? "Replace the PDF" : "Choose a different PDF";
      if (remove) remove.hidden = false;
    } else {
      slot.innerHTML = '<p class="cv-empty mono-label">No CV on file.</p>';
      if (pick) pick.textContent = "Choose a PDF";
      if (remove) remove.hidden = true;
    }
  }

  function bindCvActions() {
    var input = document.getElementById("cvInput");
    if (input) {
      input.addEventListener("change", function () {
        var file = input.files && input.files[0];
        if (!file) return;
        var note = document.getElementById("cvNote");
        if (note) { note.textContent = "Reading " + file.name + "…"; note.className = "form-note"; }

        WEA_STORE.readCv(file, function (result) {
          if (!result.ok) {
            if (note) { note.textContent = result.error; note.className = "form-note is-bad"; }
            WEA.toast(result.error);
            input.value = "";
            return;
          }
          pendingCv = result.cv;
          removeCv = false;
          if (note) {
            note.textContent = "Ready to save — press “Save changes”.";
            note.className = "form-note is-good";
          }
          renderCvSlot();
        });
      });
    }

    var remove = document.getElementById("cvRemove");
    if (remove) {
      remove.addEventListener("click", function () {
        var note = document.getElementById("cvNote");
        pendingCv = null;
        removeCv = true;
        var input = document.getElementById("cvInput");
        if (input) input.value = "";
        if (note) {
          note.textContent = "Your CV will be removed when you save.";
          note.className = "form-note is-bad";
        }
        renderCvSlot();
      });
    }
  }

  var dashBound = false;

  function bindDashActions() {
    if (dashBound) return;
    dashBound = true;

    var printBtn = document.getElementById("dashPrint");
    if (printBtn) {
      printBtn.addEventListener("click", function () {
        WEA.printCard();
      });
    }

    var copyLink = document.getElementById("dashCopyLink");
    if (copyLink) {
      copyLink.addEventListener("click", function () {
        WEA.copy(WEA.verifyUrl(member.id), copyLink);
      });
    }

    var form = document.getElementById("dashForm");
    /* ---------- Secretariat register ---------- */

    /* Profile edits are pushed back to the register so the Sheet stays
       in step with what members see in their portal. Runs after the
       local save and never blocks the "Saved" confirmation. */
    function syncProfileToSheet(record, cvRemoved) {
      if (!window.WEA_SHEET || !WEA_SHEET.configured()) return;
      WEA_SHEET.submitUpdate(record, function (res) {
        var note = document.getElementById("dashNote");
        if (!note) return;
        if (res && res.ok) {
          note.textContent = "Saved — your record is up to date and the register has been notified.";
          note.className = "form-note is-good";
          return;
        }
        if (res && res.skipped) return;
        note.textContent =
          "Saved in this browser, but the register could not be reached. Your changes are safe here and will show once synced.";
        note.className = "form-note is-bad";
      });
    }

    if (form) {
      bindCvActions();
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var note = document.getElementById("dashNote");

        var socials = readSocials();
        if (socials.__invalid) {
          delete socials.__invalid;
          if (note) { note.textContent = "Check the highlighted social handle."; note.className = "form-note is-bad"; }
          WEA.toast("One of your handles is not valid.");
          return;
        }

        var patch = {
          name: document.getElementById("dashName").value.trim(),
          phone: document.getElementById("dashPhone").value.trim(),
          city: document.getElementById("dashCity").value.trim(),
          company: document.getElementById("dashCompany").value.trim(),
          role: document.getElementById("dashRole").value.trim(),
          industry: document.getElementById("dashIndustry").value.trim(),
          website: document.getElementById("dashWebsite").value.trim(),
          socials: socials
        };

        if (!patch.name) {
          if (note) { note.textContent = "A name is required."; note.className = "form-note is-bad"; }
          document.getElementById("dashName").focus();
          return;
        }

        var result = WEA_STORE.updateMember(member.id, patch);
        if (!result || !result.ok) {
          if (note) { note.textContent = "We could not save your changes. Please try again."; note.className = "form-note is-bad"; }
          return;
        }

        /* Apply any CV change. Done after the profile write so a failed
           CV save cannot silently discard the text edits too. */
        var cvWasRemoved = removeCv;
        if (pendingCv || removeCv) {
          var cvResult = WEA_STORE.setCv(member.id, removeCv ? null : pendingCv);
          if (!cvResult || !cvResult.ok) {
            if (note) {
              note.textContent = "Your details saved, but the CV could not be stored — this browser is full. Remove some CVs and retry.";
              note.className = "form-note is-bad";
            }
            WEA.toast("Details saved. The CV did not fit in storage.");
            pendingCv = null;
            removeCv = false;
            member = result.member;
            renderDashboard(member.status === "verified");
            return;
          }
          member = cvResult.member;
          pendingCv = null;
          removeCv = false;
          var cvNote = document.getElementById("cvNote");
          if (cvNote) { cvNote.textContent = ""; cvNote.className = "form-note"; }
          var cvInput = document.getElementById("cvInput");
          if (cvInput) cvInput.value = "";
        } else {
          member = result.member;
        }

        renderDashboard(member.status === "verified");
        if (note) { note.textContent = "Saved — your record is up to date."; note.className = "form-note is-good"; }
        WEA.toast("Profile updated");

        syncProfileToSheet(member, cvWasRemoved);
      });
    }
  }

  /* ================= brand kit ================= */

  function renderSwatches() {
    var el = document.getElementById("swatchGrid");
    if (!el) return;

    el.innerHTML = D.palette
      .map(function (p) {
        return (
          '<div class="swatch">' +
          '<div class="swatch-color" style="background:' + WEA.escapeHTML(p.hex) + '"></div>' +
          '<div class="swatch-meta">' +
          "<div><strong>" + WEA.escapeHTML(p.name) + "</strong>" +
          "<span>" + WEA.escapeHTML(p.note || "") + "</span></div>" +
          '<button class="copy-btn" type="button" data-hex="' + WEA.escapeHTML(p.hex) + '">' +
          '<i class="ph ph-copy" aria-hidden="true"></i> ' + WEA.escapeHTML(p.hex) + "</button>" +
          "</div>" +
          "</div>"
        );
      })
      .join("");

    WEA.qsa("[data-hex]", el).forEach(function (btn) {
      btn.addEventListener("click", function () {
        WEA.copy(btn.getAttribute("data-hex"), btn);
      });
    });
  }

  var LOGO_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44" width="512" height="512">' +
    '<rect width="44" height="44" fill="#F6F2E9"/>' +
    '<path d="M5 33.5 13.75 10.5 22 26.25 30.25 10.5 39 33.5" fill="none" stroke="#111A2B" stroke-width="3" stroke-linejoin="miter" stroke-linecap="square"/>' +
    '<rect x="33" y="4" width="7" height="7" fill="#1F45C9"/>' +
    "</svg>";

  function download(name, content, type) {
    var blob = new Blob([content], { type: type || "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  document.getElementById("dlLogo").addEventListener("click", function () {
    download("wea-logo.svg", LOGO_SVG, "image/svg+xml");
    WEA.toast("Logo downloaded");
  });

  /* ================= campaigns ================= */

  function renderTemplates() {
    var el = document.getElementById("templateGrid");
    if (!el) return;

    el.innerHTML = D.templates
      .map(function (t, i) {
        return (
          '<article class="template-card">' +
          '<div class="template-head">' +
          "<h3>" + WEA.escapeHTML(t.title) + "</h3>" +
          '<span class="chip">' + WEA.escapeHTML(t.tag) + "</span>" +
          "</div>" +
          '<p class="template-body">' + WEA.escapeHTML(t.body) + "</p>" +
          '<button class="btn btn-ghost btn-sm" type="button" data-copy="' + i + '">' +
          '<i class="ph ph-copy" aria-hidden="true"></i> Copy template</button>' +
          "</article>"
        );
      })
      .join("");

    WEA.qsa("[data-copy]", el).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var t = D.templates[Number(btn.getAttribute("data-copy"))];
        if (!t) return;
        var body = t.body;
        if (member) {
          body = body
            .replace(/\[WEA ID\]/g, member.id)
            .replace(/\[your referral link\]/g, referralLink())
            .replace(/\[Your name\]/g, member.name);
        }
        WEA.copy(body, btn);
      });
    });
  }

  function renderHashtags() {
    var el = document.getElementById("hashtagRow");
    if (!el) return;

    el.innerHTML = D.hashtags
      .map(function (tag) {
        return '<button class="btn btn-ghost btn-sm" type="button" data-tag="' +
          WEA.escapeHTML(tag) + '">' + WEA.escapeHTML(tag) + "</button>";
      })
      .join("");

    WEA.qsa("[data-tag]", el).forEach(function (btn) {
      btn.addEventListener("click", function () {
        WEA.copy(btn.getAttribute("data-tag"), btn);
      });
    });
  }

  /* ================= ambassadors ================= */

  function referralLink() {
    var base = window.location.href.split("#")[0].replace(/portal\.html$/, "register.html");
    return base + "?ref=" + encodeURIComponent(member ? member.id : "");
  }

  function renderReferral(verified) {
    var input = document.getElementById("refLink");
    var hint = document.getElementById("refHint");
    input.value = referralLink();

    hint.textContent = verified
      ? "Tracked to " + member.name + " (" + member.id + ")."
      : "Preview only — referral tracking activates once the Secretariat verifies your membership.";

    document.getElementById("copyRef").addEventListener("click", function () {
      WEA.copy(input.value, document.getElementById("copyRef"));
    });
  }

  function renderRewards() {
    var el = document.getElementById("rewardTable");
    if (!el) return;

    var rows = [
      ["Referrals in the quarter", "Recognised"],
      ["5 verified members", "Roll of honour + 10% upgrade credit"],
      ["10 verified members", "Chapter event credit"],
      ["20 verified members", "Conference pass + 25% upgrade credit"]
    ];

    el.innerHTML = rows
      .map(function (r, i) {
        var cell = i === 0 ? "<span>" + r[0] + "</span><span>" + r[1] + "</span>"
          : "<span>" + WEA.escapeHTML(r[0]) + "</span><span>" + WEA.escapeHTML(r[1]) + "</span>";
        return '<div class="reward-row' + (i === 0 ? " is-head" : "") + '">' + cell + "</div>";
      })
      .join("");
  }

  /* ================= toolkit ================= */

  function toolkitItems() {
    var name = member ? member.name : "WEA Member";
    var company = member ? member.company : "";
    var id = member ? member.id : "WEA-0000-000000";
    var role = member ? member.role : "Member";
    var verifyUrl = window.location.origin + window.location.pathname
      .replace(/portal\.html$/, "verify.html") + "?id=" + encodeURIComponent(id);

    return [
      {
        icon: "ph-share-network",
        name: "Social media pack",
        desc: "Hashtags, bio lines and a posting cadence for every platform.",
        file: "wea-social-pack.txt",
        content: [
          "WEA SOCIAL MEDIA PACK",
          "=====================",
          "",
          "BIO LINES",
          "- Member, World Entrepreneurs Association" + (company ? " | " + company : ""),
          "- Building" + (company ? " " + company : "") + ". Part of the WEA global family.",
          "",
          "POSTING CADENCE",
          "- 1 membership post per month",
          "- 1 chapter or network post per quarter",
          "- Always tag the association and keep the call to action clear",
          "",
          "HASHTAGS",
          D.hashtags.join("  "),
          ""
        ].join("\n")
      },
      {
        icon: "ph-envelope-simple",
        name: "Email signature",
        desc: "A clean signature block showing your verified membership.",
        file: "wea-email-signature.txt",
        content: [
          "--",
          name,
          role + (company ? ", " + company : ""),
          "Member — World Entrepreneurs Association",
          "Member ID: " + id,
          "Verify: " + verifyUrl,
          ""
        ].join("\n")
      },
      {
        icon: "ph-chats-circle",
        name: "Talking points",
        desc: "How to describe WEA in thirty seconds at any event.",
        file: "wea-talking-points.txt",
        content: [
          "WEA IN THIRTY SECONDS",
          "=====================",
          "",
          "\u201CThe World Entrepreneurs Association is a global network of entrepreneurs.",
          "Members get a verified membership ID, a directory listing, cross-border introductions",
          "and access to funding, mentorship and markets. Classes start at $25 a year, and every",
          "member's record can be verified by anyone in seconds.\u201D",
          "",
          "USEFUL LINKS",
          "- Apply: register.html",
          "- Verify a member: verify.html",
          "- Member directory: members.html",
          "- Marketing portal: portal.html",
          ""
        ].join("\n")
      },
      {
        icon: "ph-file-text",
        name: "Membership one-pager",
        desc: "Plain-text overview of the association for prospects and partners.",
        file: "wea-one-pager.txt",
        content: [
          "WORLD ENTREPRENEURS ASSOCIATION",
          "================================",
          "",
          "WHAT  A global network of entrepreneurs, established in Accra in 2026.",
          "WHY   Credibility through verified IDs, connections across borders,",
          "      and growth through funding, mentorship and market access.",
          "CLASSES",
          "      Associate   $25 / year",
          "      Professional $75 / year",
          "      Corporate   $250 / year",
          "      Patron      $1,000 / year",
          "JOIN  Apply at register.html — four steps, reviewed by the Secretariat.",
          "VERIFY verify.html",
          "CONTACT wa.me/233533507112",
          ""
        ].join("\n")
      }
    ];
  }

  function renderToolkit() {
    var el = document.getElementById("toolkitGrid");
    if (!el) return;
    var items = toolkitItems();

    el.innerHTML = items
      .map(function (item, i) {
        return (
          '<article class="resource-card">' +
          '<span class="res-icon"><i class="ph ' + item.icon + '" aria-hidden="true"></i></span>' +
          "<h3>" + WEA.escapeHTML(item.name) + "</h3>" +
          "<p>" + WEA.escapeHTML(item.desc) + "</p>" +
          '<button class="btn btn-ghost btn-sm" type="button" data-dl="' + i + '">' +
          '<i class="ph ph-download-simple" aria-hidden="true"></i> Download</button>' +
          "</article>"
        );
      })
      .join("");

    WEA.qsa("[data-dl]", el).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var item = items[Number(btn.getAttribute("data-dl"))];
        if (!item) return;
        download(item.file, item.content);
        WEA.toast("Downloaded " + item.file);
      });
    });
  }

  /* ================= session restore ================= */

  var savedId = rememberedId();
  if (savedId) {
    var saved = WEA_STORE.byId(savedId);
    if (saved) {
      member = saved;
      enterPortal();
    }
  }

  WEA.init();
})();
