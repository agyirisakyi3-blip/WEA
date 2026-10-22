/* ============================================================
   WEA — Registration wizard
   4 steps: details → venture → class → review → success
   Params: ?tier=<slug> preselects a class, ?ref=<member ID> tags a referral
   ============================================================ */
(function () {
  "use strict";

  var D = window.WEA_DATA;
  var form = document.getElementById("regForm");
  if (!form) return;

  var params = new URLSearchParams(window.location.search);
  var chosenTier = params.get("tier") || "";
  var referral = params.get("ref") || "";

  /* Explicit field handles — avoids relying on form named-access. */
  var fields = {
    fullName: document.getElementById("fullName"),
    email: document.getElementById("email"),
    phone: document.getElementById("phone"),
    country: document.getElementById("country"),
    city: document.getElementById("city"),
    company: document.getElementById("company"),
    role: document.getElementById("role"),
    industry: document.getElementById("industry"),
    notes: document.getElementById("notes")
  };

  function val(name) {
    var el = fields[name];
    return el ? String(el.value || "").trim() : "";
  }

  /* ---------- validation helpers ---------- */

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function renderFieldError(field) {
    var wrap = field.closest(".field");
    if (!wrap) return;
    var msg = wrap.querySelector(".field-error");
    if (!msg) {
      msg = document.createElement("span");
      msg.className = "field-error";
      msg.setAttribute("role", "alert");
      wrap.appendChild(msg);
    }
    msg.textContent = field.dataset.errorMsg || "This field is required.";
  }

  function markInvalid(field, invalid) {
    field.setAttribute("aria-invalid", invalid ? "true" : "false");
    if (!invalid) {
      var wrap = field.closest(".field");
      var old = wrap && wrap.querySelector(".field-error");
      if (old) old.remove();
      return;
    }
    renderFieldError(field);
  }

  function validatePanel(step) {
    var panel = document.querySelector('[data-panel="' + step + '"]');
    if (!panel) return true;

    var required = WEA.qsa("[required]", panel);
    var firstBad = null;

    required.forEach(function (field) {
      var value = String(field.value || "").trim();
      var msg = "";
      if (!value) {
        msg = "This field is required.";
      } else if (field.type === "email" && !EMAIL_RE.test(value)) {
        msg = "Please enter a valid email address.";
      }
      field.dataset.errorMsg = msg;
      markInvalid(field, Boolean(msg));
      if (msg && !firstBad) firstBad = field;
    });

    if (firstBad) {
      firstBad.focus();
      WEA.toast("Please complete the highlighted field.");
      return false;
    }
    return true;
  }

  /* ---------- referral notice ---------- */

  if (referral) {
    var notice = document.getElementById("refNotice");
    var text = document.getElementById("refNoticeText");
    if (notice && text) {
      text.innerHTML =
        "You were referred by a WEA member (<strong>" +
        WEA.escapeHTML(referral) + "</strong>). This application will be tagged to their record.";
      notice.hidden = false;
    }
  }

  /* ---------- step 3: class of membership ---------- */

  function renderTierOptions() {
    var el = document.getElementById("tierOptions");
    if (!el) return;
    if (!chosenTier) chosenTier = "professional";

    el.innerHTML = D.tiers
      .map(function (t) {
        var checked = t.slug === chosenTier;
        return (
          '<label class="option-card">' +
          '<input type="radio" name="tier" value="' + WEA.escapeHTML(t.slug) + '"' +
          (checked ? " checked" : "") + " />" +
          '<span class="option-mark" aria-hidden="true"></span>' +
          '<span class="option-top">' +
          "<strong>" + WEA.escapeHTML(t.name) + "</strong>" +
          '<span class="option-price">' + WEA.escapeHTML(t.price) + " " +
          WEA.escapeHTML(t.per) + "</span>" +
          "</span>" +
          "<p>" + WEA.escapeHTML(t.for) + "</p>" +
          "<p>" + WEA.escapeHTML(t.benefits.slice(0, 3).join(" · ")) + "</p>" +
          "</label>"
        );
      })
      .join("");

    WEA.qsa('input[name="tier"]', el).forEach(function (input) {
      input.addEventListener("change", function () {
        chosenTier = input.value;
      });
    });
  }

  /* ---------- social handle fields ---------- */

  function renderSocialFields() {
    var wrap = document.getElementById("regSocials");
    if (!wrap) return;
    wrap.innerHTML = (D.socials || [])
      .map(function (p) {
        return (
          '<div class="field">' +
          '<label for="rsocial-' + WEA.escapeHTML(p.key) + '">' +
          '<i class="ph ' + WEA.escapeHTML(p.icon) + '" aria-hidden="true"></i> ' +
          WEA.escapeHTML(p.label) + "</label>" +
          '<input type="text" id="rsocial-' + WEA.escapeHTML(p.key) + '" ' +
          'data-rsocial="' + WEA.escapeHTML(p.key) + '" ' +
          'placeholder="' + WEA.escapeHTML(p.placeholder) + '" />' +
          "</div>"
        );
      })
      .join("");
  }

  function readSocials() {
    var out = {};
    WEA.qsa("[data-rsocial]", document.getElementById("regSocials") || document).forEach(function (input) {
      var key = input.getAttribute("data-rsocial");
      var handle = WEA_STORE.normaliseHandle(input.value);
      if (!handle) return;
      if (!WEA_STORE.validHandle(key, handle)) {
        input.dataset.errorMsg = "That does not look like a valid handle.";
        markInvalid(input, true);
        out.__invalid = true;
        return;
      }
      markInvalid(input, false);
      out[key] = handle;
    });
    return out;
  }

  /* ---------- CV upload ---------- */

  var pendingCv = null;

  function renderCvSlot() {
    var slot = document.getElementById("regCvSlot");
    var pick = document.getElementById("regCvPickLabel");
    var remove = document.getElementById("regCvRemove");
    if (!slot) return;

    var limit = document.getElementById("regCvLimit");
    if (limit) limit.textContent = WEA_STORE.formatBytes(WEA_STORE.cvMaxBytes);

    if (pendingCv) {
      slot.innerHTML =
        '<span class="cv-chip is-static">' +
        '<i class="ph ph-file-pdf" aria-hidden="true"></i>' +
        "<span>" + WEA.escapeHTML(pendingCv.name) + "</span>" +
        '<span class="cv-chip-size mono-label">' + WEA.escapeHTML(WEA_STORE.formatBytes(pendingCv.size)) + "</span>" +
        "</span>";
      if (pick) pick.textContent = "Replace the PDF";
      if (remove) remove.hidden = false;
    } else {
      slot.innerHTML = '<p class="cv-empty mono-label">No CV attached.</p>';
      if (pick) pick.textContent = "Choose a PDF";
      if (remove) remove.hidden = true;
    }
  }

  function bindCvActions() {
    var input = document.getElementById("regCvInput");
    if (input) {
      input.addEventListener("change", function () {
        var file = input.files && input.files[0];
        if (!file) return;
        var note = document.getElementById("regCvNote");
        if (note) { note.textContent = "Reading " + file.name + "…"; note.className = "form-note"; }

        WEA_STORE.readCv(file, function (result) {
          if (!result.ok) {
            if (note) { note.textContent = result.error; note.className = "form-note is-bad"; }
            WEA.toast(result.error);
            input.value = "";
            return;
          }
          pendingCv = result.cv;
          if (note) { note.textContent = "Attached — it will be saved with your application."; note.className = "form-note is-good"; }
          renderCvSlot();
        });
      });
    }

    var remove = document.getElementById("regCvRemove");
    if (remove) {
      remove.addEventListener("click", function () {
        var note = document.getElementById("regCvNote");
        pendingCv = null;
        var input = document.getElementById("regCvInput");
        if (input) input.value = "";
        if (note) { note.textContent = ""; note.className = "form-note"; }
        renderCvSlot();
      });
    }
  }

  /* ---------- navigation ---------- */

  function showStep(n) {
    WEA.qsa(".form-panel").forEach(function (p) {
      p.classList.toggle("active", Number(p.dataset.panel) === n);
    });
    WEA.qsa("#steps .step").forEach(function (s) {
      var i = Number(s.dataset.step);
      s.classList.toggle("active", i === n);
      s.classList.toggle("done", i < n);
    });

    if (n === 3) renderTierOptions();
    if (n === 4) renderReview();

    var card = document.querySelector(".form-card");
    if (card) {
      window.scrollTo({
        top: Math.max(0, card.getBoundingClientRect().top + window.scrollY - 110),
        behavior: WEA.reduceMotion ? "auto" : "smooth"
      });
    }
  }

  WEA.qsa("[data-next]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = Number(btn.dataset.next);
      var from = target - 1;
      if (from <= 2 && !validatePanel(from)) return;
      if (target === 4 && !chosenTier) {
        WEA.toast("Please choose a class of membership.");
        return;
      }
      showStep(target);
    });
  });

  WEA.qsa("[data-back]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      showStep(Number(btn.dataset.back));
    });
  });

  /* clear the error as soon as the field is corrected */

  WEA.qsa("#regForm input, #regForm select, #regForm textarea").forEach(function (field) {
    function clear() {
      if (field.getAttribute("aria-invalid") === "true") markInvalid(field, false);
    }
    field.addEventListener("input", clear);
    field.addEventListener("change", clear);
  });

  /* ---------- step 4: review ---------- */

  function tierBySlug(slug) {
    var list = D.tiers.filter(function (t) { return t.slug === slug; });
    return list.length ? list[0] : null;
  }

  function renderReview() {
    var list = document.getElementById("reviewList");
    if (!list) return;
    var tier = tierBySlug(chosenTier);

    var rows = [
      ["Full name", val("fullName")],
      ["Email", val("email")],
      ["Phone / WhatsApp", val("phone")],
      ["Country", val("country")],
      ["City", val("city")],
      ["Venture", val("company")],
      ["Role", val("role")],
      ["Industry", val("industry")],
      ["Class of membership", tier ? tier.name + " — " + tier.price + " " + tier.per : "—"],
      ["Referred by", referral]
    ];

    if (val("notes")) rows.push(["Notes", val("notes")]);

    /* socials, summarised as one row */
    var socials = readSocials();
    var socialParts = Object.keys(socials)
      .filter(function (k) { return k !== "__invalid"; })
      .map(function (k) {
        var p = WEA_STORE.socialPlatform(k);
        return (p ? p.label : k) + " · " + socials[k];
      });
    if (socialParts.length) rows.push(["Social", socialParts.join(", ")]);
    if (pendingCv) rows.push(["CV", pendingCv.name + " (" + WEA_STORE.formatBytes(pendingCv.size) + ")"]);

    list.innerHTML = rows
      .map(function (r) {
        return (
          '<div class="review-row"><dt>' + WEA.escapeHTML(r[0]) + "</dt>" +
          "<dd>" + (r[1] ? WEA.escapeHTML(r[1]) : "—") + "</dd></div>"
        );
      })
      .join("");
  }

  /* ---------- Secretariat register ---------- */

  /* sheet.js sits before this file, but registration must survive even
     if it ever fails to load. */
  var registerApi = window.WEA_SHEET || {
    configured: function () { return false; },
    checkEmail: function (email, done) { done({ ok: true, skipped: true, exists: false }); }
  };

  function setSync(text, kind) {
    var el = document.getElementById("regSync");
    if (!el) return;
    el.textContent = text || "";
    el.className = "form-note" + (kind ? " is-" + kind : "");
  }

  /* Called once the local save has succeeded, so a lost connection
     can never cost the applicant their membership number. Failure
     here is reported honestly rather than swallowed — the WhatsApp
     button below is the working fallback. */
  function syncToSheet(member, cv) {
    if (!registerApi.configured()) {
      setSync("Keep your member ID safe — the Secretariat will confirm after review.");
      return;
    }

    setSync("Sending your application to the Secretariat register…");

    registerApi.submitApplication(member, cv, function (res) {
      if (res && res.ok) {
        setSync("Sent to the Secretariat register" + (res.duplicate ? " (existing row updated)" : "") + ".", "good");
        return;
      }
      if (res && res.skipped) {
        setSync("Keep your member ID safe — the Secretariat will confirm after review.");
        return;
      }
      setSync(
        "Your application is saved here, but we could not reach the Secretariat register. " +
          "Please press Confirm on WhatsApp so nothing is missed. (" +
          (res && res.error ? res.error : "Unknown error") + ")",
        "bad"
      );
    });
  }

  /* ---------- submit ---------- */

  function submitApplication(socials) {
    var result = WEA_STORE.register({
      name: val("fullName"),
      email: val("email"),
      phone: val("phone"),
      country: val("country"),
      city: val("city"),
      company: val("company"),
      role: val("role"),
      industry: val("industry"),
      tier: chosenTier,
      notes: val("notes"),
      ref: referral,
      socials: socials
    });

    if (!result || result.ok === false) {
      setSync("", "");
      WEA.toast("We could not save your application. Please try again.");
      return;
    }

    var member = result.member;
    var cvForRegister = pendingCv;

    /* Attach the CV if one was chosen. A storage failure must not lose
       the application itself — warn and carry on. */
    if (pendingCv) {
      var cvResult = WEA_STORE.setCv(member.id, pendingCv);
      if (cvResult && cvResult.ok) {
        member = cvResult.member;
      } else {
        WEA.toast("Application saved, but the CV did not fit in this browser's storage.");
      }
      pendingCv = null;
    }

    /* success view */
    var card = document.getElementById("successCard");
    if (card) card.innerHTML = WEA.idCardHTML(member);

    form.hidden = true;
    var steps = document.getElementById("steps");
    if (steps) steps.hidden = true;

    var panel = document.getElementById("successPanel");
    if (panel) panel.hidden = false;

    var tier = tierBySlug(member.tier);
    var message = [
      "WEA MEMBERSHIP APPLICATION",
      "--------------------------------",
      "Member ID: " + member.id,
      "Verification code: " + member.code,
      "Name: " + member.name,
      "Venture: " + member.company + " (" + member.role + ")",
      "Country: " + member.country,
      "Class: " + (tier ? tier.name + " — " + tier.price + " " + tier.per : member.tier),
      "Status: Awaiting Secretariat review",
      member.ref ? "Referred by: " + member.ref : "",
      "--------------------------------",
      "I would like to confirm this application and complete the next steps."
    ]
      .filter(Boolean)
      .join("\n");

    var wa = document.getElementById("waConfirm");
    if (wa) {
      wa.href = "https://wa.me/233533507112?text=" + encodeURIComponent(message);
    }

    var goVerify = document.getElementById("goVerify");
    if (goVerify) {
      goVerify.href = "verify.html?id=" + encodeURIComponent(member.id);
    }

    WEA.toast("Application received — reference " + member.id);

    if (panel) {
      window.scrollTo({
        top: Math.max(0, panel.getBoundingClientRect().top + window.scrollY - 110),
        behavior: WEA.reduceMotion ? "auto" : "smooth"
      });
    }

    syncToSheet(member, cvForRegister);
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!validatePanel(1)) return showStep(1);
    if (!validatePanel(2)) return showStep(2);
    if (!chosenTier) {
      WEA.toast("Please choose a class of membership.");
      return showStep(3);
    }

    /* guard against a duplicate application for the same email */
    var email = val("email").toLowerCase();
    var existing = WEA_STORE.all().filter(function (m) {
      return String(m.email || "").trim().toLowerCase() === email;
    })[0];

    if (existing) {
      fields.email.dataset.errorMsg =
        "This email is already registered to " + existing.id +
        ". Use a different email, or check that application's status.";
      markInvalid(fields.email, true);
      WEA.toast("An application already exists for that email address.");
      showStep(1);
      fields.email.focus();
      return;
    }

    var socials = readSocials();
    if (socials.__invalid) {
      delete socials.__invalid;
      WEA.toast("Check your social handles.");
      showStep(2);
      return;
    }

    /* The check above only sees this browser. The register knows about
       applications from every device, so ask it before writing. A
       failed check must not block someone from applying. */
    registerApi.checkEmail(email, function (check) {
      if (check && check.ok && check.exists) {
        fields.email.dataset.errorMsg =
          "An application already exists for that email address. " +
          "Check your email or WhatsApp the Secretariat for its status.";
        markInvalid(fields.email, true);
        WEA.toast("An application already exists for that email address.");
        showStep(1);
        fields.email.focus();
        return;
      }
      submitApplication(socials);
    });
  });

  /* ---------- start another application ---------- */

  var newApp = document.getElementById("newApp");
  if (newApp) {
    newApp.addEventListener("click", function () {
      form.reset();
      form.hidden = false;
      var steps = document.getElementById("steps");
      if (steps) steps.hidden = false;
      var panel = document.getElementById("successPanel");
      if (panel) panel.hidden = true;
      var card = document.getElementById("successCard");
      if (card) card.innerHTML = "";
      WEA.qsa(".field-error").forEach(function (e) { e.remove(); });
      WEA.qsa("[aria-invalid]").forEach(function (f) {
        f.setAttribute("aria-invalid", "false");
      });
      chosenTier = params.get("tier") || "professional";
      pendingCv = null;
      var cvInput = document.getElementById("regCvInput");
      if (cvInput) cvInput.value = "";
      var cvNote = document.getElementById("regCvNote");
      if (cvNote) { cvNote.textContent = ""; cvNote.className = "form-note"; }
      WEA.qsa("[data-rsocial]").forEach(function (i) { i.value = ""; });
      renderCvSlot();
      renderTierOptions();
      showStep(1);
    });
  }

  /* ---------- init ---------- */

  renderSocialFields();
  bindCvActions();
  renderCvSlot();
  renderTierOptions();
  showStep(1);
  WEA.init();
})();
