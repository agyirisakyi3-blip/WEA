(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  var nav = qs(".nav");
  var sentinel = qs("#sentinel");

  if (nav && sentinel && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      nav.classList.toggle("scrolled", !entries[0].isIntersecting);
    }).observe(sentinel);
  } else if (nav) {
    nav.classList.add("scrolled");
  }

  var menuBtn = qs("#menuBtn");
  var mobileMenu = qs("#mobileMenu");

  function setMenu(open) {
    mobileMenu.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("menu-open", open);
  }

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", function () {
      setMenu(!mobileMenu.classList.contains("open"));
    });
    qsa("a", mobileMenu).forEach(function (link) {
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

  var revealEls = qsa(".reveal");

  function showAll() {
    revealEls.forEach(function (el) {
      el.classList.add("in");
    });
  }

  if (reduceMotion || !("IntersectionObserver" in window)) {
    showAll();
  } else {
    var revealObserver = new IntersectionObserver(
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
    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  var counters = qsa("[data-count]");

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

  if (counters.length) {
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
        renderCounter(el, 0);
        counterObserver.observe(el);
      });
    } else {
      counters.forEach(animateCounter);
    }
  }

  qsa(".pillar-item").forEach(function (item) {
    var btn = qs(".pillar-row", item);
    btn.addEventListener("click", function () {
      var isOpen = item.classList.contains("open");
      qsa(".pillar-item.open").forEach(function (other) {
        other.classList.remove("open");
        qs(".pillar-row", other).setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        item.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  if ("IntersectionObserver" in window) {
    var navLinks = qsa(".nav-links a");
    var sections = qsa("main section[id]");
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

  var joinForm = qs("#joinForm");

  if (joinForm) {
    var nameInput = qs("#fName");
    var countryInput = qs("#fCountry");
    var errName = qs("#errName");
    var errCountry = qs("#errCountry");

    joinForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = nameInput.value.trim();
      var country = countryInput.value.trim();
      var valid = true;

      errName.hidden = name.length >= 2;
      if (name.length < 2) valid = false;
      errCountry.hidden = country.length >= 2;
      if (country.length < 2) valid = false;
      if (!valid) return;

      var message =
        "Hello WEA, my name is " + name + " from " + country + ". I would like to join the World Entrepreneurs Association.";
      window.open("https://wa.me/233533507112?text=" + encodeURIComponent(message), "_blank", "noopener");
      joinForm.reset();
    });

    nameInput.addEventListener("input", function () {
      errName.hidden = true;
    });
    countryInput.addEventListener("input", function () {
      errCountry.hidden = true;
    });
  }

  var yearEl = qs("#year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
})();
