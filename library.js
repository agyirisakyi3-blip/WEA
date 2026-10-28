(function (global) {
  "use strict";

  var DB_NAME = "wea.library.v1";
  var DB_VERSION = 1;
  var STORE = "books";
  var MAX_PDF_BYTES = 25 * 1024 * 1024;
  var MAX_COVER_BYTES = 6 * 1024 * 1024;

  var PALETTES = [
    ["#1f45c9", "#0b1322", "#f6f2e9"],
    ["#cf4520", "#52180a", "#f6f2e9"],
    ["#16735a", "#08291f", "#f6f2e9"],
    ["#8a6a1f", "#2f2306", "#f6f2e9"],
    ["#5b3fb0", "#1a1035", "#f6f2e9"],
    ["#0f5f78", "#06222c", "#f6f2e9"]
  ];

  var dbPromise = null;

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      if (!global.indexedDB) {
        reject(new Error("This browser cannot store a library."));
        return;
      }
      var request = global.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = function () {
        var db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          var store = db.createObjectStore(STORE, { keyPath: "id" });
          store.createIndex("createdAt", "createdAt");
          store.createIndex("category", "category");
          store.createIndex("author", "author");
        }
      };
      request.onsuccess = function () {
        resolve(request.result);
      };
      request.onerror = function () {
        reject(request.error || new Error("The library could not be opened."));
      };
    });
    return dbPromise;
  }

  function getAll() {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var request = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
        request.onsuccess = function () {
          resolve(request.result || []);
        };
        request.onerror = function () {
          reject(request.error || new Error("The library could not be read."));
        };
      });
    });
  }

  function getBook(id) {
    if (!id) return Promise.resolve(null);
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var request = db.transaction(STORE, "readonly").objectStore(STORE).get(id);
        request.onsuccess = function () {
          resolve(request.result || null);
        };
        request.onerror = function () {
          reject(request.error || new Error("The book could not be read."));
        };
      });
    });
  }

  function putBook(record) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var transaction = db.transaction(STORE, "readwrite");
        transaction.objectStore(STORE).put(record);
        transaction.oncomplete = function () {
          resolve(record);
        };
        transaction.onerror = function () {
          reject(transaction.error || new Error("The book could not be saved."));
        };
        transaction.onabort = function () {
          reject(transaction.error || new Error("The book could not be saved."));
        };
      });
    });
  }

  function removeBook(id) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var transaction = db.transaction(STORE, "readwrite");
        transaction.objectStore(STORE).delete(id);
        transaction.oncomplete = function () {
          resolve(true);
        };
        transaction.onerror = function () {
          reject(transaction.error || new Error("The book could not be removed."));
        };
      });
    });
  }

  function sortBooks(list) {
    return list.slice().sort(function (a, b) {
      var ac = String(a.createdAt || "");
      var bc = String(b.createdAt || "");
      if (ac !== bc) return ac < bc ? 1 : -1;
      return String(a.title || "").localeCompare(String(b.title || ""));
    });
  }

  function list() {
    return getAll().then(sortBooks);
  }

  function makeId() {
    var random = "";
    var cryptoObj = global.crypto || global.msCrypto;
    if (cryptoObj && cryptoObj.getRandomValues) {
      var bytes = new Uint8Array(6);
      cryptoObj.getRandomValues(bytes);
      for (var i = 0; i < bytes.length; i++) {
        random += ("0" + bytes[i].toString(36)).slice(-2);
      }
    } else {
      random = Math.random().toString(36).slice(2, 12);
    }
    return "book-" + Date.now().toString(36) + "-" + random;
  }

  function clean(value) {
    return String(value == null ? "" : value).trim();
  }

  function add(input) {
    var data = input || {};
    if (!clean(data.title)) {
      return Promise.reject(new Error("A title is required."));
    }
    if (!clean(data.author)) {
      return Promise.reject(new Error("An author name is required."));
    }
    if (!data.pdf) {
      return Promise.reject(new Error("A PDF is required."));
    }

    var record = {
      id: data.id || makeId(),
      title: clean(data.title),
      author: clean(data.author),
      authorBio: clean(data.authorBio),
      authorLink: clean(data.authorLink),
      category: clean(data.category) || "Entrepreneurship",
      year: clean(data.year),
      language: clean(data.language) || "English",
      description: clean(data.description),
      cover: data.cover || "",
      pdf: data.pdf,
      pdfName: data.pdf && data.pdf.name ? data.pdf.name : "book.pdf",
      size: data.pdf && data.pdf.size ? data.pdf.size : 0,
      uploadedBy: clean(data.uploadedBy),
      uploadedByName: clean(data.uploadedByName),
      createdAt: data.createdAt || new Date().toISOString(),
      opens: 0,
      remote: false,
      previewUrl: "",
      downloadUrl: "",
      viewUrl: "",
      coverUrl: ""
    };

    return putBook(record);
  }

  function attachRemote(id, remote) {
    if (!id || !remote) return Promise.resolve(null);
    return getBook(id).then(function (record) {
      if (!record) return null;
      record.remote = true;
      record.remoteId = remote.id || record.id;
      record.previewUrl = remote.previewUrl || "";
      record.downloadUrl = remote.downloadUrl || "";
      record.viewUrl = remote.viewUrl || "";
      record.coverUrl = remote.coverUrl || "";
      record.remoteCreatedAt = remote.createdAt || "";
      return putBook(record);
    });
  }

  function touch(id) {
    if (!id) return Promise.resolve(null);
    return getBook(id).then(function (record) {
      if (!record) return null;
      record.opens = (Number(record.opens) || 0) + 1;
      record.lastReadAt = new Date().toISOString();
      return putBook(record);
    });
  }

  function readPdf(file, done) {
    if (!file) return done({ ok: false, error: "No file selected." });
    var name = String(file.name || "book.pdf");
    var isPdf = file.type === "application/pdf" || /\.pdf$/i.test(name);
    if (!isPdf) {
      return done({ ok: false, error: "Please choose a PDF file." });
    }
    if (file.size > MAX_PDF_BYTES) {
      return done({
        ok: false,
        error: "That PDF is " + formatBytes(file.size) + ". The limit is " +
          formatBytes(MAX_PDF_BYTES) + "."
      });
    }
    if (!file.size) {
      return done({ ok: false, error: "That file is empty." });
    }
    done({ ok: true, file: file, name: name, size: file.size });
  }

  function readCover(file, done) {
    if (!file) return done({ ok: false, error: "No file selected." });
    var allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.indexOf(file.type) === -1) {
      return done({ ok: false, error: "Choose a JPG, PNG, WebP or GIF image." });
    }
    if (file.size > MAX_COVER_BYTES) {
      return done({
        ok: false,
        error: "That image is " + formatBytes(file.size) + ". The limit is " +
          formatBytes(MAX_COVER_BYTES) + "."
      });
    }
    if (!file.size) {
      return done({ ok: false, error: "That file is empty." });
    }

    var reader = new global.FileReader();
    reader.onerror = function () {
      done({ ok: false, error: "We could not read that image." });
    };
    reader.onload = function () {
      var source = String(reader.result || "");
      if (source.indexOf("data:") !== 0) {
        return done({ ok: false, error: "We could not read that image." });
      }
      var image = new global.Image();
      image.onerror = function () {
        done({ ok: false, error: "That image could not be opened." });
      };
      image.onload = function () {
        var width = image.naturalWidth || image.width;
        var height = image.naturalHeight || image.height;
        if (!width || !height) {
          return done({ ok: false, error: "That image could not be opened." });
        }
        var max = 900;
        var scale = Math.min(1, max / Math.max(width, height));
        var canvas = global.document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(width * scale));
        canvas.height = Math.max(1, Math.round(height * scale));
        var context = canvas.getContext("2d");
        if (!context) {
          return done({ ok: false, error: "That image could not be processed." });
        }
        context.fillStyle = "#f6f2e9";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        var data;
        try {
          data = canvas.toDataURL("image/jpeg", 0.84);
        } catch (err) {
          return done({ ok: false, error: "That image could not be processed." });
        }
        done({
          ok: true,
          cover: {
            data: data,
            name: String(file.name || "cover.jpg").slice(0, 120),
            size: Math.round((data.length * 3) / 4)
          }
        });
      };
      image.src = source;
    };
    reader.readAsDataURL(file);
  }

  function formatBytes(n) {
    var value = Number(n) || 0;
    if (value < 1024) return value + " B";
    if (value < 1024 * 1024) return (value / 1024).toFixed(0) + " KB";
    return (value / (1024 * 1024)).toFixed(1) + " MB";
  }

  function hash(text) {
    var value = 0;
    var str = String(text || "");
    for (var i = 0; i < str.length; i++) {
      value = (value * 31 + str.charCodeAt(i)) % 1000003;
    }
    return value;
  }

  function palette(seed) {
    var pick = PALETTES[hash(seed) % PALETTES.length];
    return { a: pick[0], b: pick[1], ink: pick[2] };
  }

  function initials(text) {
    var words = String(text || "WEA")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!words.length) return "W";
    var first = words[0].charAt(0);
    var second = words.length > 1 ? words[words.length - 1].charAt(0) : "";
    return (first + second).toUpperCase();
  }

  function bookLink(id) {
    var base = "";
    if (global.WEA_DATA && global.WEA_DATA.site && global.WEA_DATA.site.baseUrl) {
      base = String(global.WEA_DATA.site.baseUrl).replace(/\/$/, "");
    }
    return base + "/books.html#book=" + encodeURIComponent(id);
  }

  global.WEA_LIBRARY = {
    list: list,
    get: getBook,
    add: add,
    remove: removeBook,
    attachRemote: attachRemote,
    touch: touch,
    readPdf: readPdf,
    readCover: readCover,
    formatBytes: formatBytes,
    palette: palette,
    initials: initials,
    bookLink: bookLink,
    maxPdfBytes: MAX_PDF_BYTES,
    maxCoverBytes: MAX_COVER_BYTES
  };
})(window);
