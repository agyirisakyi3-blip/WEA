(function () {
  "use strict";

  var D = window.WEA_DATA || {};
  var UPLOADER_KEY = "wea.library.uploader";

  var grid = document.getElementById("bookGrid");
  var empty = document.getElementById("bookEmpty");
  var countEl = document.getElementById("bookCount");
  var syncEl = document.getElementById("librarySync");
  var searchEl = document.getElementById("bookSearch");
  var categoryEl = document.getElementById("bookCategory");
  var sortEl = document.getElementById("bookSort");
  var statsEl = document.getElementById("libraryStats");

  var gate = document.getElementById("uploadGate");
  var gateForm = document.getElementById("uploadGateForm");
  var gateInput = document.getElementById("uploadGateInput");
  var gateError = document.getElementById("uploadGateError");
  var form = document.getElementById("uploadForm");
  var noteEl = document.getElementById("bookNote");
  var submitBtn = document.getElementById("bookSubmit");

  var dialog = document.getElementById("readerDialog");
  var frame = document.getElementById("readerFrame");
  var loading = document.getElementById("readerLoading");
  var readerNote = document.getElementById("readerNote");

  var state = {
    local: [],
    remote: [],
    books: [],
    byId: {},
    uploader: null,
    pendingCover: null,
    pendingPdf: null,
    readerUrl: null,
    readerTimer: null
  };

  function esc(value) {
    return WEA.escapeHTML(value);
  }

  function clean(value) {
    return String(value == null ? "" : value).trim();
  }

  function slug(value) {
    return String(value || "book")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 70) || "book";
  }

  function setNote(message, tone) {
    if (!noteEl) return;
    noteEl.textContent = message || "";
    noteEl.className = "form-note" + (tone ? " is-" + tone : "");
  }

  function setSync(mode, extra) {
    if (!syncEl) return;
    var icons = {
      local: "ph-device-mobile",
      syncing: "ph-circle-notch",
      shared: "ph-cloud-check",
      error: "ph-warning-circle"
    };
    var labels = {
      local: "Saved on this device",
      syncing: "Syncing shared library…",
      shared: "Shared library" + (extra ? " · " + extra + " titles" : ""),
      error: "Shared library unavailable"
    };
    syncEl.className = "library-sync mono-label is-" + mode;
    syncEl.innerHTML = '<i class="ph ' + icons[mode] + '" aria-hidden="true"></i> ' +
      esc(labels[mode] || "");
  }

  function fileToBase64(file, done) {
    if (!file) return done("");
    var reader = new FileReader();
    reader.onerror = function () {
      done("");
    };
    reader.onload = function () {
      var result = String(reader.result || "");
      var comma = result.indexOf(",");
      done(comma === -1 ? "" : result.slice(comma + 1));
    };
    reader.readAsDataURL(file);
  }

  function safeUrl(value) {
    var url = clean(value);
    if (!url) return "";
    if (/^(https?:\/\/|blob:|data:image\/)/i.test(url)) return url;
    return /^[^:]+$/.test(url) ? url : "";
  }

  function mix(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] || {};
      Object.keys(source).forEach(function (key) {
        target[key] = source[key];
      });
    }
    return target;
  }

  function remoteToBook(remote) {
    return {
      id: remote.id,
      title: remote.title || "Untitled",
      author: remote.author || "WEA member",
      authorBio: remote.authorBio || "",
      authorLink: remote.authorLink || "",
      category: remote.category || "Entrepreneurship",
      year: remote.year || "",
      language: remote.language || "English",
      description: remote.description || "",
      cover: "",
      coverUrl: remote.coverUrl || "",
      pdf: null,
      pdfName: remote.pdfName || "book.pdf",
      size: Number(remote.size) || 0,
      uploadedBy: remote.uploadedBy || "",
      uploadedByName: remote.uploadedByName || "",
      createdAt: remote.createdAt || "",
      opens: Number(remote.opens) || 0,
      remote: true,
      previewUrl: remote.previewUrl || "",
      downloadUrl: remote.downloadUrl || "",
      viewUrl: remote.viewUrl || ""
    };
  }

  function seedBooks() {
    return (D.bookSeeds || []).filter(function (seed) {
      return seed && seed.id && seed.title;
    }).map(function (seed) {
      return mix({}, seed, {
        cover: "",
        coverUrl: seed.coverUrl || "",
        pdf: null,
        previewUrl: "",
        viewUrl: "",
        downloadUrl: seed.pdfUrl || "",
        opens: 0,
        remote: false,
        seeded: true
      });
    });
  }

  function mergeBooks() {
    var map = {};
    seedBooks().forEach(function (book) {
      map[book.id] = book;
    });
    state.local.forEach(function (book) {
      map[book.id] = book;
    });
    state.remote.forEach(function (remote) {
      if (!remote || !remote.id) return;
      if (map[remote.id]) {
        map[remote.id] = mix({}, map[remote.id], {
          remote: true,
          previewUrl: remote.previewUrl || map[remote.id].previewUrl || "",
          downloadUrl: remote.downloadUrl || map[remote.id].downloadUrl || "",
          viewUrl: remote.viewUrl || map[remote.id].viewUrl || "",
          coverUrl: remote.coverUrl || map[remote.id].coverUrl || "",
          opens: Number(remote.opens) || map[remote.id].opens || 0
        });
      } else {
        map[remote.id] = remoteToBook(remote);
      }
    });
    state.byId = map;
    state.books = Object.keys(map).map(function (id) {
      return map[id];
    });
    state.books.sort(function (a, b) {
      var ac = String(a.createdAt || "");
      var bc = String(b.createdAt || "");
      if (ac !== bc) return ac < bc ? 1 : -1;
      return String(a.title || "").localeCompare(String(b.title || ""));
    });
  }

  function unique(values) {
    var seen = {};
    var out = [];
    values.forEach(function (value) {
      var key = clean(value).toLowerCase();
      if (!key || seen[key]) return;
      seen[key] = true;
      out.push(clean(value));
    });
    return out;
  }

  function renderCategories() {
    if (!categoryEl) return;
    var current = categoryEl.value;
    var categories = unique((D.bookCategories || []).concat(state.books.map(function (book) {
      return book.category;
    })));
    categories.sort();
    categoryEl.innerHTML = '<option value="">All categories</option>' +
      categories.map(function (category) {
        return '<option value="' + esc(category) + '">' + esc(category) + "</option>";
      }).join("");
    if (current && categories.indexOf(current) !== -1) categoryEl.value = current;
  }

  function renderStats() {
    if (!statsEl) return;
    var authors = unique(state.books.map(function (book) {
      return book.author;
    }));
    var categories = unique(state.books.map(function (book) {
      return book.category;
    }));
    var reads = state.books.reduce(function (total, book) {
      return total + (Number(book.opens) || 0);
    }, 0);
    var cells = [
      { count: state.books.length, label: "Titles on the shelf" },
      { count: authors.length, label: "Authors published" },
      { count: categories.length, label: "Topics covered" },
      { count: reads, label: "Books opened" }
    ];
    statsEl.innerHTML = cells.map(function (cell) {
      return '<div class="stat-cell">' +
        '<strong><span data-count="' + cell.count + '">0</span></strong>' +
        "<span>" + esc(cell.label) + "</span>" +
        "</div>";
    }).join("");
  }

  function coverMarkup(book, className) {
    var title = book.title || "Untitled";
    var author = book.author || "WEA member";
    var image = safeUrl(book.cover || book.coverUrl);
    if (image) {
      return '<span class="' + className + '">' +
        '<img src="' + esc(image) + '" alt="Cover of ' + esc(title) + '" loading="lazy" />' +
        "</span>";
    }
    var colors = WEA_LIBRARY.palette(title + " " + author);
    return '<span class="' + className + ' book-cover--custom" style="--book-a:' + colors.a +
      ";--book-b:" + colors.b + ";--book-ink:" + colors.ink + '">' +
      '<span class="book-cover-mark">WEA Library</span>' +
      '<span class="book-cover-initials">' + esc(WEA_LIBRARY.initials(title)) + "</span>" +
      '<span class="book-cover-titles"><strong>' + esc(title) + "</strong><span>" +
      esc(author) + "</span></span>" +
      "</span>";
  }

  function filtered() {
    var query = searchEl ? searchEl.value.trim().toLowerCase() : "";
    var category = categoryEl ? categoryEl.value : "";
    var sort = sortEl ? sortEl.value : "newest";
    var rows = state.books.filter(function (book) {
      if (category && book.category !== category) return false;
      if (!query) return true;
      var haystack = [
        book.title,
        book.author,
        book.category,
        book.description,
        book.authorBio,
        book.uploadedByName,
        book.year,
        book.language
      ].join(" ").toLowerCase();
      return haystack.indexOf(query) !== -1;
    });
    rows.sort(function (a, b) {
      if (sort === "title") return String(a.title).localeCompare(String(b.title));
      if (sort === "author") return String(a.author).localeCompare(String(b.author));
      if (sort === "popular") {
        var diff = (Number(b.opens) || 0) - (Number(a.opens) || 0);
        if (diff) return diff;
        return String(a.title).localeCompare(String(b.title));
      }
      var ac = String(a.createdAt || "");
      var bc = String(b.createdAt || "");
      if (ac !== bc) return ac < bc ? 1 : -1;
      return String(a.title).localeCompare(String(b.title));
    });
    return rows;
  }

  function cardMarkup(book, index) {
    var readable = Boolean(book.pdf || book.pdfUrl || book.previewUrl || book.viewUrl || book.downloadUrl);
    var description = book.description || book.authorBio || "A book shared with the WEA network.";
    var meta = [];
    if (book.year) meta.push(esc(book.year));
    if (book.language) meta.push(esc(book.language));
    if (book.size) meta.push(esc(WEA_LIBRARY.formatBytes(book.size)));
    if (book.remote) meta.push("Shared");
    return '<article class="book-card reveal" style="--d:' + Math.min(index * 55, 330) + 'ms">' +
      '<button class="book-cover-btn" type="button" data-read="' + esc(book.id) + '" ' +
      'aria-label="Read ' + esc(book.title) + ' by ' + esc(book.author) + '">' +
      coverMarkup(book, "book-cover") +
      "</button>" +
      '<div class="book-body">' +
      '<span class="book-cat mono-label">' + esc(book.category) + "</span>" +
      "<h3>" + esc(book.title) + "</h3>" +
      '<p class="book-author">by ' + esc(book.author) + "</p>" +
      '<p class="book-desc">' + esc(description) + "</p>" +
      '<div class="book-meta">' + meta.map(function (item) {
        return "<span>" + item + "</span>";
      }).join("") + "</div>" +
      '<div class="book-actions">' +
      '<button class="btn btn-primary btn-sm book-read" type="button" data-read="' + esc(book.id) + '"' +
      (readable ? "" : " disabled") + ">" +
      '<i class="ph ph-book-open" aria-hidden="true"></i> ' +
      (readable ? "Read book" : "Unavailable") + "</button>" +
      "</div>" +
      "</div>" +
      "</article>";
  }

  function renderGrid(rows) {
    if (!grid) return;
    grid.innerHTML = rows.map(cardMarkup).join("");
    if (empty) empty.hidden = rows.length > 0;
    if (countEl) {
      countEl.textContent = rows.length + (rows.length === 1 ? " book" : " books") +
        " shown" + (rows.length !== state.books.length ? " of " + state.books.length : "");
    }
    WEA.init();
  }

  function apply() {
    renderGrid(filtered());
  }

  function renderAll() {
    renderCategories();
    renderStats();
    apply();
    WEA.init();
  }

  function readCoverFile() {
    var input = document.getElementById("bookCover");
    var file = input && input.files && input.files[0];
    if (!file) return;
    var preview = document.getElementById("bookCoverPreview");
    if (preview) preview.innerHTML = '<span class="mono-label">Reading image…</span>';
    WEA_LIBRARY.readCover(file, function (result) {
      if (!result.ok) {
        state.pendingCover = null;
        if (preview) preview.innerHTML = "";
        setNote(result.error, "bad");
        WEA.toast(result.error);
        input.value = "";
        return;
      }
      state.pendingCover = result.cover;
      renderCoverPreview();
      setNote("Cover ready.", "good");
    });
  }

  function renderCoverPreview() {
    var preview = document.getElementById("bookCoverPreview");
    if (!preview) return;
    if (!state.pendingCover) {
      preview.innerHTML = '<span class="mono-label">No cover — we will design one.</span>';
      return;
    }
    preview.innerHTML = '<img src="' + esc(state.pendingCover.data) + '" alt="Selected cover art" />' +
      '<span class="mono-label">' + esc(WEA_LIBRARY.formatBytes(state.pendingCover.size)) + "</span>";
  }

  function readPdfFile() {
    var input = document.getElementById("bookPdf");
    var file = input && input.files && input.files[0];
    if (!file) return;
    WEA_LIBRARY.readPdf(file, function (result) {
      if (!result.ok) {
        state.pendingPdf = null;
        renderPdfChip();
        setNote(result.error, "bad");
        WEA.toast(result.error);
        input.value = "";
        return;
      }
      state.pendingPdf = result;
      renderPdfChip();
      setNote("PDF ready — add the details and publish.", "good");
    });
  }

  function renderPdfChip() {
    var chip = document.getElementById("bookPdfChip");
    var zone = document.getElementById("bookPdfZone");
    if (!chip) return;
    if (!state.pendingPdf) {
      chip.hidden = true;
      chip.innerHTML = "";
      if (zone) zone.classList.remove("is-ready");
      return;
    }
    chip.hidden = false;
    chip.innerHTML = '<i class="ph ph-file-pdf" aria-hidden="true"></i><span>' +
      esc(state.pendingPdf.name) + '</span><span class="mono-label">' +
      esc(WEA_LIBRARY.formatBytes(state.pendingPdf.size)) + "</span>";
    if (zone) zone.classList.add("is-ready");
  }

  function value(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  function resetUploadFields() {
    ["bookTitle", "bookDescription", "bookYear"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = "";
    });
    var cover = document.getElementById("bookCover");
    var pdf = document.getElementById("bookPdf");
    var consent = document.getElementById("bookConsent");
    if (cover) cover.value = "";
    if (pdf) pdf.value = "";
    if (consent) consent.checked = false;
    state.pendingCover = null;
    state.pendingPdf = null;
    renderCoverPreview();
    renderPdfChip();
  }

  function publishRemote(localBook, cover, pdfFile) {
    if (!window.WEA_SHEET || !WEA_SHEET.configured() || !WEA_SHEET.submitBook) {
      setNote("Published. This library is saved on this device.", "good");
      WEA.toast("Book published to this device's library");
      return;
    }

    setNote("Saved here. Sharing with the network…", "");

    fileToBase64(pdfFile, function (pdfBase64) {
      if (!pdfBase64) {
        setNote("Saved on this device, but the shared library could not be reached.", "bad");
        return;
      }
      var coverPayload = null;
      if (cover && cover.data) {
        var comma = cover.data.indexOf(",");
        coverPayload = {
          name: cover.name || "cover.jpg",
          size: cover.size || 0,
          mime: "image/jpeg",
          base64: comma === -1 ? "" : cover.data.slice(comma + 1)
        };
      }
      var payload = {
        id: localBook.id,
        title: localBook.title,
        author: localBook.author,
        authorBio: localBook.authorBio,
        authorLink: localBook.authorLink,
        category: localBook.category,
        year: localBook.year,
        language: localBook.language,
        description: localBook.description,
        uploadedBy: localBook.uploadedBy,
        uploadedByName: localBook.uploadedByName,
        createdAt: localBook.createdAt
      };
      WEA_SHEET.submitBook(payload, coverPayload, {
        name: localBook.pdfName,
        size: localBook.size,
        mime: "application/pdf",
        base64: pdfBase64
      }, function (result) {
        if (result && result.ok && result.book) {
          WEA_LIBRARY.attachRemote(localBook.id, result.book).then(function () {
            return WEA_LIBRARY.list();
          }).then(function (books) {
            state.local = books;
            mergeBooks();
            renderAll();
          });
          setNote("Published to the shared library.", "good");
          WEA.toast("Book published to the shared library");
          return;
        }
        setNote("Saved on this device. " +
          ((result && result.error) || "The shared library could not be reached."), "bad");
      });
    });
  }

  function handlePublish(event) {
    event.preventDefault();
    if (!state.uploader) {
      setNote("Unlock with your member ID first.", "bad");
      return;
    }

    var title = value("bookTitle");
    var author = value("bookAuthor");
    var authorLink = value("bookAuthorLink");
    var year = value("bookYear");
    var consent = document.getElementById("bookConsent");

    if (!title) {
      setNote("Give the book a title.", "bad");
      document.getElementById("bookTitle").focus();
      return;
    }
    if (!author) {
      setNote("Add the author's name.", "bad");
      document.getElementById("bookAuthor").focus();
      return;
    }
    if (!state.pendingPdf) {
      setNote("Choose the book PDF.", "bad");
      document.getElementById("bookPdf").focus();
      return;
    }
    if (year && (Number(year) < 1900 || Number(year) > 2100)) {
      setNote("The year should be between 1900 and 2100.", "bad");
      document.getElementById("bookYear").focus();
      return;
    }
    if (authorLink && !/^https?:\/\//i.test(authorLink)) {
      setNote("The author link should start with http:// or https://.", "bad");
      document.getElementById("bookAuthorLink").focus();
      return;
    }
    if (!consent || !consent.checked) {
      setNote("Please confirm you have permission to share this book.", "bad");
      if (consent) consent.focus();
      return;
    }

    var cover = state.pendingCover;
    var pdf = state.pendingPdf;

    if (submitBtn) submitBtn.disabled = true;
    setNote("Publishing…", "");

    WEA_LIBRARY.add({
      title: title,
      author: author,
      authorBio: value("bookAuthorBio"),
      authorLink: authorLink,
      category: value("bookCategoryInput") || "Entrepreneurship",
      year: year,
      language: value("bookLanguage") || "English",
      description: value("bookDescription"),
      cover: cover ? cover.data : "",
      pdf: pdf.file,
      uploadedBy: state.uploader.id,
      uploadedByName: state.uploader.name
    }).then(function (book) {
      resetUploadFields();
      return WEA_LIBRARY.list().then(function (books) {
        state.local = books;
        mergeBooks();
        renderAll();
        publishRemote(book, cover, pdf.file);
      });
    }).catch(function (error) {
      setNote((error && error.message) || "The book could not be saved. This browser may be out of space.", "bad");
      WEA.toast("The book could not be saved");
    }).then(function () {
      if (submitBtn) submitBtn.disabled = false;
    });
  }

  function showGateError(message) {
    if (!gateError) return;
    gateError.textContent = message;
    gateError.hidden = false;
    gateInput.setAttribute("aria-invalid", "true");
  }

  function clearGateError() {
    if (!gateError) return;
    gateError.hidden = true;
    gateError.textContent = "";
    gateInput.setAttribute("aria-invalid", "false");
  }

  function suggestedBio(member) {
    var parts = [];
    if (member.role) parts.push(member.role);
    if (member.company && member.company !== "World Entrepreneurs Association") {
      parts.push("at " + member.company);
    }
    if (member.industry) parts.push("· " + member.industry);
    return parts.join(" ");
  }

  function setUploader(member) {
    if (!member) return;
    state.uploader = member;
    try {
      sessionStorage.setItem(UPLOADER_KEY, member.id);
    } catch (err) {
      /* session-only */
    }

    if (gate) gate.hidden = true;
    if (form) form.hidden = false;

    var avatar = document.getElementById("uploaderAvatar");
    var name = document.getElementById("uploaderName");
    var id = document.getElementById("uploaderId");
    if (avatar) avatar.textContent = WEA.initials(member.name);
    if (name) name.textContent = member.name;
    if (id) {
      id.textContent = (member.status === "verified" ? "Verified member" : "Member") +
        " · " + member.id;
    }

    var author = document.getElementById("bookAuthor");
    var link = document.getElementById("bookAuthorLink");
    var bio = document.getElementById("bookAuthorBio");
    if (author && !author.value) author.value = member.name || "";
    if (link && !link.value && member.website) link.value = member.website;
    if (bio && !bio.value) bio.value = suggestedBio(member);

    clearGateError();
    renderCoverPreview();
    renderPdfChip();
  }

  function clearUploader() {
    state.uploader = null;
    try {
      sessionStorage.removeItem(UPLOADER_KEY);
    } catch (err) {
      /* ignore */
    }
    if (form) form.hidden = true;
    if (gate) gate.hidden = false;
    if (gateInput) gateInput.value = "";
    clearGateError();
    setNote("", "");
  }

  function restoreUploader() {
    var id = null;
    try {
      id = sessionStorage.getItem(UPLOADER_KEY);
    } catch (err) {
      id = null;
    }
    if (!id) return;
    var member = WEA_STORE.byId(id) || WEA_STORE.find(id);
    if (member) setUploader(member);
  }

  function unlockUploader(event) {
    event.preventDefault();
    var query = gateInput ? gateInput.value.trim() : "";
    if (!query) {
      showGateError("Enter your member ID or verification code.");
      gateInput.focus();
      return;
    }
    var member = WEA_STORE.find(query);
    if (!member) {
      showGateError("No WEA record matches that ID or code. Check it and try again.");
      gateInput.focus();
      return;
    }
    setUploader(member);
    WEA.toast("Uploader unlocked");
  }

  function hashBookId() {
    var match = /^#book=(.+)$/.exec(window.location.hash || "");
    if (!match) return null;
    try {
      return decodeURIComponent(match[1]);
    } catch (err) {
      return null;
    }
  }

  function setHash(id) {
    if (!window.history || !window.history.replaceState) return;
    try {
      window.history.replaceState(null, "", "#book=" + encodeURIComponent(id));
    } catch (err) {
      /* ignore */
    }
  }

  function clearHash() {
    if (!window.history || !window.history.replaceState) return;
    try {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    } catch (err) {
      /* ignore */
    }
  }

  function readerMeta(book) {
    var rows = [];
    if (book.category) rows.push(["Category", book.category]);
    if (book.year) rows.push(["Year", book.year]);
    if (book.language) rows.push(["Language", book.language]);
    if (book.size) rows.push(["File", WEA_LIBRARY.formatBytes(book.size)]);
    if (book.uploadedByName) rows.push(["Shared by", book.uploadedByName]);
    if (book.opens) rows.push(["Opened", book.opens + (book.opens === 1 ? " time" : " times")]);
    return rows.map(function (row) {
      return "<div><dt>" + esc(row[0]) + "</dt><dd>" + esc(row[1]) + "</dd></div>";
    }).join("");
  }

  function openReader(id, fromHash) {
    var book = state.byId[id];
    if (!book) return;

    var mediaUrl = "";
    if (book.pdf) {
      try {
        mediaUrl = URL.createObjectURL(book.pdf);
      } catch (err) {
        mediaUrl = "";
      }
    }
    var source = mediaUrl || book.pdfUrl || safeUrl(book.previewUrl) || safeUrl(book.viewUrl) || "";
    if (!source) {
      WEA.toast("This book's file is not available.");
      return;
    }

    if (state.readerUrl && state.readerUrl !== mediaUrl) {
      try {
        URL.revokeObjectURL(state.readerUrl);
      } catch (err) {
        /* ignore */
      }
    }
    state.readerUrl = mediaUrl || null;

    var titleEl = document.getElementById("readerTitle");
    var authorEl = document.getElementById("readerAuthor");
    var heading = document.getElementById("readerHeading");
    var byline = document.getElementById("readerByline");
    var description = document.getElementById("readerDescription");
    var cover = document.getElementById("readerCover");
    var meta = document.getElementById("readerMeta");
    var authorBlock = document.getElementById("readerAuthorBlock");
    var download = document.getElementById("readerDownload");
    var open = document.getElementById("readerOpen");
    var share = document.getElementById("readerShare");

    if (titleEl) titleEl.textContent = book.title;
    if (authorEl) authorEl.textContent = "by " + book.author;
    if (heading) heading.textContent = book.title;
    if (byline) byline.textContent = "by " + book.author;
    if (description) {
      description.textContent = book.description ||
        "This book has been shared with the WEA library.";
    }
    if (cover) cover.innerHTML = coverMarkup(book, "book-cover book-cover--reader");
    if (meta) meta.innerHTML = readerMeta(book);

    if (authorBlock) {
      var authorBits = [];
      if (book.authorBio) authorBits.push('<p class="reader-bio">' + esc(book.authorBio) + "</p>");
      if (/^https?:\/\//i.test(clean(book.authorLink))) {
        authorBits.push('<a class="btn btn-ghost btn-sm" href="' + esc(book.authorLink) +
          '" target="_blank" rel="noopener noreferrer"><i class="ph ph-link" aria-hidden="true"></i> Author link</a>');
      }
      authorBlock.innerHTML = authorBits.join("");
      authorBlock.hidden = !authorBits.length;
    }

    if (download) {
      download.href = mediaUrl || safeUrl(book.downloadUrl) || source;
      if (mediaUrl) {
        download.setAttribute("download", slug(book.title) + ".pdf");
      } else {
        download.removeAttribute("download");
      }
    }
    if (open) {
      open.href = mediaUrl || safeUrl(book.viewUrl) || safeUrl(book.previewUrl) || source;
    }
    if (share) {
      share.hidden = !(book.remote || book.seeded);
      share.setAttribute("data-share", book.id);
    }

    if (loading) loading.hidden = false;
    if (readerNote) readerNote.hidden = true;
    if (frame) {
      frame.title = "Reading " + book.title;
      frame.src = source;
    }

    if (!fromHash) setHash(book.id);

    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }

    if (state.readerTimer) window.clearTimeout(state.readerTimer);
    state.readerTimer = window.setTimeout(function () {
      if (!dialog.open) return;
      if (loading) loading.hidden = true;
      if (readerNote && book.remote) {
        readerNote.textContent = "If the pages do not appear, use “New tab” to open this book.";
        readerNote.hidden = false;
      }
    }, 12000);

    WEA_LIBRARY.touch(book.id).then(function (updated) {
      if (!updated) return;
      book.opens = updated.opens;
    });

    if (book.remote && window.WEA_SHEET && WEA_SHEET.configured() && WEA_SHEET.bookOpened) {
      WEA_SHEET.bookOpened(book.id, function () {});
    }
  }

  function closeReader() {
    if (typeof dialog.close === "function" && dialog.open) {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
      cleanupReader();
    }
  }

  function cleanupReader() {
    if (state.readerTimer) {
      window.clearTimeout(state.readerTimer);
      state.readerTimer = null;
    }
    if (state.readerUrl) {
      try {
        URL.revokeObjectURL(state.readerUrl);
      } catch (err) {
        /* ignore */
      }
      state.readerUrl = null;
    }
    if (frame) frame.src = "about:blank";
    if (loading) loading.hidden = false;
    if (readerNote) readerNote.hidden = true;
    if (hashBookId()) clearHash();
  }

  function syncRemote() {
    if (!window.WEA_SHEET || !WEA_SHEET.configured() || !WEA_SHEET.listBooks) {
      setSync("local");
      return;
    }
    setSync("syncing");
    WEA_SHEET.listBooks(function (result) {
      if (result && result.ok && Array.isArray(result.books)) {
        state.remote = result.books;
        setSync("shared", String(state.remote.length));
      } else if (result && result.skipped) {
        state.remote = [];
        setSync("local");
      } else {
        state.remote = [];
        setSync("error");
      }
      mergeBooks();
      renderAll();
      maybeOpenHash();
    });
  }

  function loadLocal() {
    return WEA_LIBRARY.list().then(function (books) {
      state.local = books;
      mergeBooks();
      renderAll();
      maybeOpenHash();
    }).catch(function (error) {
      state.local = [];
      mergeBooks();
      renderAll();
      maybeOpenHash();
      if (countEl) countEl.textContent = (error && error.message) || "The library could not be opened.";
    });
  }

  function maybeOpenHash() {
    if (dialog && dialog.open) return;
    var id = hashBookId();
    if (!id) return;
    if (!state.byId[id]) return;
    window.setTimeout(function () {
      if (dialog && dialog.open) return;
      openReader(id, true);
    }, 120);
  }

  function bind() {
    if (gateForm) gateForm.addEventListener("submit", unlockUploader);
    if (gateInput) gateInput.addEventListener("input", clearGateError);

    var switchBtn = document.getElementById("uploadSwitch");
    if (switchBtn) switchBtn.addEventListener("click", clearUploader);

    var coverInput = document.getElementById("bookCover");
    if (coverInput) coverInput.addEventListener("change", readCoverFile);

    var pdfInput = document.getElementById("bookPdf");
    if (pdfInput) pdfInput.addEventListener("change", readPdfFile);

    if (form) form.addEventListener("submit", handlePublish);

    var categoryInput = document.getElementById("bookCategoryInput");
    var languageInput = document.getElementById("bookLanguage");
    if (categoryInput) {
      categoryInput.innerHTML = (D.bookCategories || []).map(function (category) {
        return '<option value="' + esc(category) + '">' + esc(category) + "</option>";
      }).join("");
      categoryInput.value = "Entrepreneurship";
    }
    if (languageInput) {
      languageInput.innerHTML = (D.bookLanguages || ["English"]).map(function (language) {
        return '<option value="' + esc(language) + '">' + esc(language) + "</option>";
      }).join("");
      languageInput.value = "English";
    }

    if (grid) {
      grid.addEventListener("click", function (event) {
        var trigger = event.target.closest("[data-read]");
        if (!trigger) return;
        openReader(trigger.getAttribute("data-read"));
      });
    }

    if (searchEl) searchEl.addEventListener("input", apply);
    if (categoryEl) categoryEl.addEventListener("change", apply);
    if (sortEl) sortEl.addEventListener("change", apply);

    var closeBtn = document.getElementById("readerClose");
    if (closeBtn) closeBtn.addEventListener("click", closeReader);
    if (dialog) {
      dialog.addEventListener("close", cleanupReader);
      dialog.addEventListener("click", function (event) {
        if (event.target === dialog) closeReader();
      });
    }
    if (frame) {
      frame.addEventListener("load", function () {
        if (loading && dialog && dialog.open && frame.src !== "about:blank") {
          loading.hidden = true;
        }
      });
    }

    var share = document.getElementById("readerShare");
    if (share) {
      share.addEventListener("click", function () {
        var id = share.getAttribute("data-share");
        if (id) WEA.copy(WEA_LIBRARY.bookLink(id), share);
      });
    }

    window.addEventListener("hashchange", maybeOpenHash);
  }

  bind();
  restoreUploader();
  renderCoverPreview();
  renderPdfChip();
  loadLocal().then(syncRemote);
})();
