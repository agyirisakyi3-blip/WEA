/* ============================================================
   WEA — Google Sheet bridge
   Pushes applications to a Google Sheet through an Apps Script
   web app, so the Secretariat gets a real ledger instead of data
   trapped in each visitor's browser.

   localStorage stays the source of truth for the public site (the
   verify page and member portal read from it). This module only
   mirrors new applications out to the Sheet.

   Config lives in WEA_DATA.sheet. When no endpoint is set the
   module reports { skipped: true } and the site behaves exactly
   as it did before — nothing breaks while the Sheet is unset.
   ============================================================ */

(function (global) {
  "use strict";

  var TIMEOUT_MS = 20000;

  function config() {
    var d = global.WEA_DATA || {};
    return d.sheet || {};
  }

  function configured() {
    return Boolean(config().endpoint);
  }

  /* ---------- transport ---------- */

  /* Content-Type is text/plain on purpose. A JSON content type would
     trigger a CORS preflight OPTIONS request, which Apps Script web
     apps do not answer — plain text sails straight through and the
     script still reads e.postData.contents fine. */
  function request(payload, done) {
    var cfg = config();
    if (!cfg.endpoint) return done({ ok: false, skipped: true });

    var body = JSON.stringify(payload);
    var timer = null;
    var settled = false;

    function finish(result) {
      if (settled) return;
      settled = true;
      if (timer) global.clearTimeout(timer);
      done(result);
    }

    if (!global.fetch) {
      return finish({ ok: false, error: "This browser cannot reach the Secretariat desk. Please confirm by WhatsApp." });
    }

    timer = global.setTimeout(function () {
      finish({ ok: false, error: "The Secretariat desk did not respond in time." });
    }, TIMEOUT_MS);

    global.fetch(cfg.endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: body
    })
      .then(function (res) {
        return res.text();
      })
      .then(function (text) {
        var parsed = null;
        try {
          parsed = JSON.parse(text);
        } catch (err) {
          parsed = null;
        }
        if (!parsed || typeof parsed.ok === "undefined") {
          return finish({ ok: false, error: "The Secretariat desk replied but the answer was unclear." });
        }
        finish(parsed);
      })
      .catch(function () {
        finish({ ok: false, error: "We could not reach the Secretariat desk. Check your connection and try again." });
      });
  }

  /* ---------- payload ---------- */

  function tierName(slug) {
    var list = (global.WEA_DATA && global.WEA_DATA.tiers) || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].slug === slug) return list[i].name;
    }
    return slug || "";
  }

  function serialiseSocials(socials) {
    var parts = [];
    if (!socials) return "";
    Object.keys(socials).forEach(function (key) {
      var p = WEA_STORE.socialPlatform(key);
      parts.push((p ? p.label : key) + ": @" + socials[key]);
    });
    return parts.join("  ");
  }

  /* Apps Script cannot parse a browser FormData body, and a PDF data
     URL is far larger than a Sheet cell allows. CVs are handed over
     as base64 for the script to drop into Drive; the Sheet only ever
     stores the resulting link. */
  function cvPayload(cv) {
    if (!cv || !cv.data) return null;
    var comma = String(cv.data).indexOf(",");
    if (comma === -1) return null;
    return {
      name: String(cv.name || "cv.pdf").slice(0, 120),
      size: Number(cv.size) || 0,
      mime: String(cv.type || "application/pdf"),
      base64: String(cv.data).slice(comma + 1)
    };
  }

  /* ---------- public API ---------- */

  /* Ask the Sheet whether this email already has an application.
     The local check only sees this browser, so without this the same
     person could apply twice from two devices. */
  function checkEmail(email, done) {
    if (!configured()) return done({ ok: true, skipped: true, exists: false });
    request({ action: "check", email: String(email || "").toLowerCase() }, function (res) {
      done({
        ok: res.ok,
        skipped: Boolean(res.skipped),
        exists: Boolean(res.exists),
        error: res.error
      });
    });
  }

  /* Mirror a saved application to the Sheet. Safe to call after the
     local save has already succeeded — a failure here must never
     cost the applicant their membership number. */
  function submitApplication(member, cv, done) {
    if (!configured()) return done({ ok: true, skipped: true });
    if (!member) return done({ ok: false, error: "No application supplied." });

    request(
      {
        action: "submit",
        member: {
          id: member.id,
          code: member.code,
          name: member.name,
          email: member.email,
          phone: member.phone,
          country: member.country,
          city: member.city,
          company: member.company,
          role: member.role,
          industry: member.industry,
          website: member.website,
          tier: member.tier,
          tierName: tierName(member.tier),
          status: member.status,
          joined: member.joined,
          ref: member.ref || "",
          notes: member.notes || "",
          socials: serialiseSocials(member.socials)
        },
        cv: cvPayload(cv)
      },
      done
    );
  }

  /* Mirror a portal profile edit back to the Sheet. */
  function submitUpdate(member, done) {
    if (!configured()) return done({ ok: true, skipped: true });
    if (!member) return done({ ok: false, error: "No member supplied." });

    request(
      {
        action: "update",
        member: {
          id: member.id,
          code: member.code,
          name: member.name,
          email: member.email,
          phone: member.phone,
          country: member.country,
          city: member.city,
          company: member.company,
          role: member.role,
          industry: member.industry,
          website: member.website,
          tier: member.tier,
          tierName: tierName(member.tier),
          status: member.status,
          joined: member.joined,
          ref: member.ref || "",
          notes: member.notes || "",
          socials: serialiseSocials(member.socials)
        },
        cvRemoved: member.cvRemoved === true
      },
      done
    );
  }

  global.WEA_SHEET = {
    configured: configured,
    checkEmail: checkEmail,
    submitApplication: submitApplication,
    submitUpdate: submitUpdate
  };
})(window);
