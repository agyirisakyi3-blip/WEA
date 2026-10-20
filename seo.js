/* ============================================================
   WEA — Structured data (JSON-LD)
   Builds Organization, WebSite, FAQPage and BreadcrumbList schema
   from WEA_DATA so the markup can never drift from the visible
   content. Injected at runtime; search engines that execute JS
   (Google does) will read it.

   Usage: give <body> a data-schema attribute listing which blocks
   to emit, e.g. data-schema="organization website faq breadcrumb"
   ============================================================ */

(function () {
  "use strict";

  var D = window.WEA_DATA;
  if (!D) return;

  var site = D.site || {};
  var base = (site.baseUrl || "").replace(/\/$/, "");

  var page = (window.location.pathname.split("/").pop() || "index.html");
  var pageUrl = base + "/" + (page === "" ? "index.html" : page);

  function absolute(path) {
    if (!path) return base + "/";
    if (/^https?:\/\//.test(path)) return path;
    return base + "/" + path.replace(/^\//, "");
  }

  function organization() {
    return {
      "@type": "Organization",
      "@id": base + "/#organization",
      name: site.name || "World Entrepreneurs Association",
      alternateName: site.shortName || "WEA",
      url: base + "/",
      logo: absolute("social/wea-og.png"),
      image: absolute("social/wea-og.png"),
      description: site.description || "",
      slogan: site.tagline || "",
      foundingDate: site.founded || "",
      foundingLocation: {
        "@type": "Place",
        name: (site.address && site.address.city) || "Accra",
        address: {
          "@type": "PostalAddress",
          addressLocality: (site.address && site.address.city) || "Accra",
          addressCountry: (site.address && site.address.country) || "Ghana"
        }
      },
      address: {
        "@type": "PostalAddress",
        addressLocality: (site.address && site.address.city) || "Accra",
        addressRegion: (site.address && site.address.region) || "",
        addressCountry: (site.address && site.address.country) || "Ghana"
      },
      email: site.email || "",
      telephone: site.whatsapp ? "+" + site.whatsapp : "",
      sameAs: [],
      member: (D.executives || []).map(function (e) {
        return {
          "@type": "Person",
          name: e.name,
          jobTitle: e.title
        };
      })
    };
  }

  function website() {
    return {
      "@type": "WebSite",
      "@id": base + "/#website",
      url: base + "/",
      name: site.name || "World Entrepreneurs Association",
      description: site.description || "",
      publisher: { "@id": base + "/#organization" },
      inLanguage: "en"
    };
  }

  function faq() {
    var items = D.faq || [];
    if (!items.length) return null;
    return {
      "@type": "FAQPage",
      "@id": pageUrl + "#faq",
      mainEntity: items.map(function (item) {
        return {
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a }
        };
      })
    };
  }

  function breadcrumb() {
    var label = document.title.split("—")[0].trim();
    var items = [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: absolute("index.html")
      }
    ];
    if (page && page !== "index.html") {
      items.push({
        "@type": "ListItem",
        position: 2,
        name: label || page,
        item: pageUrl
      });
    }
    return {
      "@type": "BreadcrumbList",
      "@id": pageUrl + "#breadcrumb",
      itemListElement: items
    };
  }

  function events() {
    var items = D.events || [];
    if (!items.length) return null;
    /* Relative to today, not a fixed year, so the calendar keeps
       publishing as it rolls forward. Past items are excluded on
       their own status, which the Secretariat controls. */
    var today = new Date();
    var cutoff = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    var upcoming = items.filter(function (e) {
      var d = new Date(e.date + "T00:00:00Z");
      return !isNaN(d.getTime()) && d.getTime() >= cutoff && e.status !== "past";
    });
    if (!upcoming.length) return null;
    return upcoming.map(function (e) {
      return {
        "@type": "Event",
        "@id": pageUrl + "#event-" + encodeURIComponent(e.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")),
        name: e.title,
        description: e.summary,
        startDate: e.date,
        endDate: e.endDate || e.date,
        eventAttendanceMode: /online/i.test(e.location)
          ? "https://schema.org/OnlineEventAttendanceMode"
          : "https://schema.org/OfflineEventAttendanceMode",
        eventStatus: "https://schema.org/EventScheduled",
        location: {
          "@type": "Place",
          name: e.location
        },
        organizer: { "@id": base + "/#organization" }
      };
    });
  }

  var builders = {
    organization: organization,
    website: website,
    faq: faq,
    breadcrumb: breadcrumb,
    events: events
  };

  var wanted = (document.body.getAttribute("data-schema") || "")
    .split(/\s+/)
    .filter(Boolean);
  if (!wanted.length) return;

  var graph = [];
  wanted.forEach(function (key) {
    var build = builders[key];
    if (!build) return;
    var node = build();
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(function (n) { if (n) graph.push(n); });
    } else {
      graph.push(node);
    }
  });
  if (!graph.length) return;

  var script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": graph
  });
  document.head.appendChild(script);
})();
