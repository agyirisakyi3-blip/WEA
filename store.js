/* ============================================================
   WEA — Member store
   Frontend-only registry backed by localStorage.
   Swap load/save for API calls to move to a real backend.
   ============================================================ */

(function (global) {
  "use strict";

  var KEY = "wea.members.v1";

  function pad(n, width) {
    var s = String(n);
    while (s.length < width) s = "0" + s;
    return s;
  }

  function randomBlock(len) {
    var alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
    var out = "";
    var cryptoObj = global.crypto || global.msCrypto;
    if (cryptoObj && cryptoObj.getRandomValues) {
      var bytes = new Uint8Array(len);
      cryptoObj.getRandomValues(bytes);
      for (var i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
      return out;
    }
    for (var j = 0; j < len; j++) {
      out += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return out;
  }

  function makeCode() {
    return randomBlock(4) + "-" + randomBlock(4);
  }

  function seedMembers() {
    var list = [];
    var execs = (global.WEA_DATA && global.WEA_DATA.executives) || [];
    var samples = (global.WEA_DATA && global.WEA_DATA.sampleMembers) || [];

    execs.forEach(function (e) {
      list.push({
        id: e.id,
        code: e.code,
        name: e.name,
        photo: e.photo || "",
        email: "",
        phone: "",
        country: e.region,
        city: "",
        company: "World Entrepreneurs Association",
        role: e.title,
        industry: "Association",
        tier: e.id === "WEA-2026-000001" ? "patron" : "professional",
        status: "verified",
        joined: e.joined,
        executive: true
      });
    });

    samples.forEach(function (m) {
      var copy = {};
      Object.keys(m).forEach(function (k) {
        copy[k] = m[k];
      });
      copy.sample = true;
      list.push(copy);
    });

    return list;
  }

  function freshState() {
    return {
      v: 1,
      seq: 10007,
      members: seedMembers()
    };
  }

  function load() {
    try {
      var raw = global.localStorage.getItem(KEY);
      if (!raw) {
        var state = freshState();
        save(state);
        return state;
      }
      var parsed = JSON.parse(raw);
      if (!parsed || parsed.v !== 1 || !Array.isArray(parsed.members)) {
        state = freshState();
        save(state);
        return state;
      }
      return parsed;
    } catch (err) {
      return freshState();
    }
  }

  function save(state) {
    try {
      global.localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (err) {
      return false;
    }
  }

  function normalise(value) {
    return String(value || "").trim().toLowerCase();
  }

  /* Canonical comparison form: lowercase, letters and digits only.
     Lets a member type "wea 2026 000001", "WEA-2026-000001" or
     "wea2026000001" and still match their record. */
  function canonical(value) {
    return normalise(value).replace(/[^a-z0-9]/g, "");
  }

  function find(query) {
    var q = normalise(query);
    if (!q) return null;
    var qc = canonical(query);
    if (!qc) return null;
    var members = load().members;

    /* exact pass first so unambiguous IDs win over loose matches */
    for (var i = 0; i < members.length; i++) {
      var m = members[i];
      if (normalise(m.id) === q || normalise(m.code) === q) return m;
    }
    for (var j = 0; j < members.length; j++) {
      var n = members[j];
      if (canonical(n.id) === qc || canonical(n.code) === qc) return n;
    }
    return null;
  }

  function byId(id) {
    var target = canonical(id);
    if (!target) return null;
    var members = load().members;
    for (var i = 0; i < members.length; i++) {
      if (canonical(members[i].id) === target) return members[i];
    }
    return null;
  }

  function all() {
    return load().members;
  }

  function registered() {
    return load().members.filter(function (m) {
      return !m.executive && !m.sample;
    });
  }

  function register(data) {
    var state = load();
    var year = new Date().getFullYear();

    /* one application per email address */
    var email = normalise(data.email);
    if (email) {
      for (var e = 0; e < state.members.length; e++) {
        if (normalise(state.members[e].email) === email) {
          return { ok: false, error: "duplicate-email", member: state.members[e] };
        }
      }
    }

    var member = {
      id: "WEA-" + year + "-" + pad(state.seq, 6),
      code: makeCode(),
      name: data.name || "",
      email: data.email || "",
      phone: data.phone || "",
      country: data.country || "",
      city: data.city || "",
      company: data.company || "",
      role: data.role || "",
      industry: data.industry || "",
      website: data.website || "",
      tier: data.tier || "associate",
      status: "pending",
      joined: new Date().toISOString().slice(0, 10),
      ref: data.ref || "",
      notes: data.notes || "",
      socials: cleanSocials(data.socials)
    };
    state.seq += 1;
    state.members.push(member);
    if (!save(state)) {
      return { ok: false, member: member };
    }
    return { ok: true, member: member };
  }

  function stats() {
    var members = load().members;
    var countries = {};
    members.forEach(function (m) {
      if (m.country) countries[normalise(m.country)] = true;
    });
    return {
      total: members.length,
      verified: members.filter(function (m) {
        return m.status === "verified";
      }).length,
      pending: members.filter(function (m) {
        return m.status === "pending";
      }).length,
      countries: Object.keys(countries).length,
      council: members.filter(function (m) {
        return m.executive;
      }).length
    };
  }

  /* ---------- referrals ---------- */

  /* Members who were referred by the given member (matched on either
     their member ID or their verification code). */
  function referralsOf(member) {
    if (!member) return [];
    var ids = [canonical(member.id), canonical(member.code)].filter(Boolean);
    return load().members.filter(function (m) {
      if (!m.ref) return false;
      var ref = canonical(m.ref);
      return ids.indexOf(ref) !== -1;
    });
  }

  function referralStats(member) {
    var list = referralsOf(member);
    return {
      total: list.length,
      verified: list.filter(function (m) {
        return m.status === "verified";
      }).length,
      pending: list.filter(function (m) {
        return m.status === "pending";
      }).length,
      list: list
    };
  }

  /* ---------- membership state ---------- */

  /* A membership is valid for one year from the join date. Returns a
     small state object the portal and verify page can render. */
  function membershipState(member) {
    if (!member) return { status: "unknown", label: "Unknown", days: 0, expires: null, expired: false };
    if (member.status === "pending") {
      return { status: "pending", label: "Awaiting review", days: 0, expires: null, expired: false };
    }
    var joined = new Date(member.joined);
    if (isNaN(joined.getTime())) {
      return { status: "verified", label: "Verified member", days: 0, expires: null, expired: false };
    }
    var expires = new Date(joined.getTime());
    expires.setFullYear(expires.getFullYear() + 1);
    var now = new Date();
    var days = Math.ceil((expires.getTime() - now.getTime()) / 86400000);
    if (days < 0) {
      return { status: "expired", label: "Membership expired", days: days, expires: expires, expired: true };
    }
    if (days <= 60) {
      return { status: "expiring", label: "Renewal due soon", days: days, expires: expires, expired: false };
    }
    return { status: "active", label: "Active member", days: days, expires: expires, expired: false };
  }

  /* ---------- social handles ---------- */

  /* Accepts "@ama", "ama", a bare handle in a URL, or a full profile URL
     and reduces it to the bare handle the platform expects. Returns ""
     when nothing usable can be extracted. */
  function normaliseHandle(value) {
    var raw = String(value == null ? "" : value).trim();
    if (!raw) return "";
    /* A pasted URL: take the last meaningful path segment. */
    if (/^https?:\/\//i.test(raw)) {
      try {
        var u = new global.URL(raw);
        var parts = u.pathname.split("/").filter(Boolean);
        if (!parts.length) return "";
        raw = parts[parts.length - 1];
      } catch (err) {
        return "";
      }
    }
    raw = raw.replace(/^@+/, "").trim();
    /* Strip a trailing query or fragment that survived the split. */
    raw = raw.split("?")[0].split("#")[0];
    return raw;
  }

  function socialPlatform(key) {
    var list = (global.WEA_DATA && global.WEA_DATA.socials) || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].key === key) return list[i];
    }
    return null;
  }

  /* Build the profile URL for a stored handle. */
  function socialUrl(key, handle) {
    var p = socialPlatform(key);
    var h = normaliseHandle(handle);
    if (!p || !h) return "";
    return p.url + encodeURIComponent(h).replace(/%40/g, "@");
  }

  /* Validate a handle against the platform's own rules. */
  function validHandle(key, handle) {
    var p = socialPlatform(key);
    var h = normaliseHandle(handle);
    if (!p) return false;
    if (!h) return true; /* empty means "not provided" */
    return new RegExp(p.pattern).test(h);
  }

  /* Keep only known platforms, normalised handles, no blanks. */
  function cleanSocials(input) {
    var out = {};
    if (!input || typeof input !== "object") return out;
    var list = (global.WEA_DATA && global.WEA_DATA.socials) || [];
    list.forEach(function (p) {
      var h = normaliseHandle(input[p.key]);
      if (h) out[p.key] = h;
    });
    return out;
  }

  global.WEA_STORE_socials = {
    normaliseHandle: normaliseHandle,
    platform: socialPlatform,
    socialUrl: socialUrl,
    validHandle: validHandle,
    clean: cleanSocials
  };

  /* ---------- CV storage ----------
     A CV is held as a data URL so it survives a refresh with no backend.
     localStorage is a shared ~5MB budget, so uploads are capped well
     below it and the caller gets a reason it was refused rather than a
     silent failure. */

  var CV_MAX_BYTES = 1.5 * 1024 * 1024;
  var CV_MIME = ["application/pdf"];

  function cvAccept() {
    return "application/pdf,.pdf";
  }

  function readCv(file, done) {
    if (!file) return done({ ok: false, error: "No file selected." });
    if (CV_MIME.indexOf(file.type) === -1) {
      return done({ ok: false, error: "Please upload a PDF. Other formats are not accepted." });
    }
    if (file.size > CV_MAX_BYTES) {
      return done({
        ok: false,
        error: "That PDF is " + formatBytes(file.size) + ". The limit is " +
          formatBytes(CV_MAX_BYTES) + " — please compress it and try again."
      });
    }
    if (file.size === 0) {
      return done({ ok: false, error: "That file is empty." });
    }
    var reader = new global.FileReader();
    reader.onerror = function () {
      done({ ok: false, error: "We could not read that file. Please try again." });
    };
    reader.onload = function () {
      var url = String(reader.result || "");
      if (url.indexOf("data:") !== 0) {
        return done({ ok: false, error: "We could not read that file. Please try again." });
      }
      done({
        ok: true,
        cv: {
          name: String(file.name || "cv.pdf").slice(0, 120),
          size: file.size,
          type: "application/pdf",
          data: url,
          added: new Date().toISOString().slice(0, 10)
        }
      });
    };
    reader.readAsDataURL(file);
  }

  function formatBytes(n) {
    var v = Number(n) || 0;
    if (v < 1024) return v + " B";
    if (v < 1024 * 1024) return (v / 1024).toFixed(0) + " KB";
    return (v / (1024 * 1024)).toFixed(1) + " MB";
  }

  /* Approximate the origin's storage usage so the portal can warn before
     an upload fails. Returns bytes used by our own key. */
  function cvUsage() {
    try {
      var raw = global.localStorage.getItem(KEY) || "";
      return raw.length;
    } catch (err) {
      return 0;
    }
  }

  /* ---------- mutations ---------- */


  /* Update a member's own editable details. Only whitelisted fields
     can be changed through the member portal. */
  var EDITABLE = ["name", "phone", "city", "company", "role", "industry", "website", "notes", "socials"];

  function updateMember(id, patch) {
    var state = load();
    var target = canonical(id);
    for (var i = 0; i < state.members.length; i++) {
      if (canonical(state.members[i].id) !== target) continue;
      var m = state.members[i];
      EDITABLE.forEach(function (key) {
        if (!Object.prototype.hasOwnProperty.call(patch, key)) return;
        if (key === "socials") {
          m.socials = cleanSocials(patch.socials);
        } else {
          m[key] = String(patch[key] == null ? "" : patch[key]);
        }
      });
      if (!save(state)) return { ok: false, error: "storage", member: m };
      return { ok: true, member: m };
    }
    return { ok: false, error: "not-found", member: null };
  }

  /* ---------- CV mutations ----------
     Kept separate from updateMember so a CV is never accidentally
     cleared by a profile save that simply omits the field. */

  function setCv(id, cv) {
    var state = load();
    var target = canonical(id);
    for (var i = 0; i < state.members.length; i++) {
      if (canonical(state.members[i].id) !== target) continue;
      var m = state.members[i];
      if (!cv) {
        delete m.cv;
      } else {
        m.cv = {
          name: String(cv.name || "cv.pdf").slice(0, 120),
          size: Number(cv.size) || 0,
          type: "application/pdf",
          data: String(cv.data || ""),
          added: cv.added || new Date().toISOString().slice(0, 10)
        };
      }
      if (!save(state)) return { ok: false, error: "storage", member: m };
      return { ok: true, member: m };
    }
    return { ok: false, error: "not-found", member: null };
  }

  function hasCv(member) {
    return Boolean(member && member.cv && member.cv.data);
  }

  function cvDownloadHref(member) {
    if (!hasCv(member)) return "";
    return member.cv.data;
  }

  global.WEA_STORE = {
    all: all,
    find: find,
    byId: byId,
    register: register,
    stats: stats,
    registered: registered,
    referralsOf: referralsOf,
    referralStats: referralStats,
    membershipState: membershipState,
    updateMember: updateMember,
    setCv: setCv,
    hasCv: hasCv,
    cvDownloadHref: cvDownloadHref,
    cvAccept: cvAccept,
    readCv: readCv,
    formatBytes: formatBytes,
    cvUsage: cvUsage,
    cvMaxBytes: CV_MAX_BYTES,
    cleanSocials: cleanSocials,
    socialUrl: socialUrl,
    socialPlatform: socialPlatform,
    normaliseHandle: normaliseHandle,
    validHandle: validHandle,
    tierName: function (slug) {
      var tiers = (global.WEA_DATA && global.WEA_DATA.tiers) || [];
      for (var i = 0; i < tiers.length; i++) {
        if (tiers[i].slug === slug) return tiers[i].name;
      }
      return slug;
    },
    makeCode: makeCode,
    canonical: canonical
  };
})(window);
