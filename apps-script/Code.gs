/* ============================================================
   WEA — Google Sheet backend (Apps Script)
   Paste this into Extensions ▸ Apps Script on your Google Sheet,
   then Deploy ▸ New deployment ▸ Web app. Full steps in README.md.

   What it does
   -----------
   • doPost   receives applications from the WEA website and writes
              one row per application to the "Applications" tab.
   • check    answers "does this email already exist?" so the site
              can block duplicate applications across devices.
   • update   writes a member's portal profile edits back to the
              same row, matched on Member ID.
   • CVs go to a Drive folder, not the Sheet — a PDF is far larger
              than a cell can hold. Only the Drive link is stored.

   Everything below runs as YOU, the Sheet owner. Visitors never see
   your spreadsheet; they only know the web app URL.
   ============================================================ */

/* ---------- configuration ---------- */

var CONFIG = {
  /* Tab that holds applications. Created automatically if missing. */
  SHEET_NAME: "Applications",

  /* Optional. Leave "" to have a "WEA CVs" folder created for you.
     Set to a folder ID to file CVs somewhere you already use. */
  CV_FOLDER_ID: "",

  /* CVs arrive base64-encoded. This is the ceiling the website also
     enforces, kept here so a hand-crafted request cannot flood Drive. */
  CV_MAX_BYTES: 1.5 * 1024 * 1024,

  /* Book library. Books and covers are filed in Drive; the Library tab
     keeps the metadata and the Drive links. */
  LIBRARY_SHEET_NAME: "Library",
  LIBRARY_FOLDER_ID: "",
  BOOK_MAX_BYTES: 25 * 1024 * 1024,
  COVER_MAX_BYTES: 6 * 1024 * 1024
};

var HEADERS = [
  "Timestamp", "Event", "Status", "Member ID", "Code", "Full name",
  "Email", "Phone", "Country", "City", "Venture", "Role", "Industry",
  "Website", "Class", "Joined", "Referred by", "Socials", "Notes", "CV"
];

var LIBRARY_HEADERS = [
  "Timestamp", "Book ID", "Title", "Author", "Author bio", "Author link",
  "Category", "Year", "Language", "Description", "Cover ID", "Cover URL",
  "PDF ID", "Preview URL", "View URL", "Download URL", "PDF name", "Size",
  "Uploaded by", "Member ID", "Opens"
];

/* ---------- entry points ---------- */

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(60000); /* one writer at a time, or rows collide */
  } catch (err) {
    return json({ ok: false, error: "The register is busy. Please try again in a moment." });
  }

  try {
    var payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    var action = payload.action || "submit";

    if (action === "check") {
      return json({ ok: true, exists: emailExists(payload.email) });
    }
    if (action === "submit") {
      return json(submit(payload));
    }
    if (action === "update") {
      return json(update(payload));
    }
    if (action === "book-submit") {
      return json(saveBook(payload));
    }
    if (action === "book-list") {
      return json({ ok: true, books: listBooks() });
    }
    if (action === "book-open") {
      return json(markBookOpened(payload.id));
    }
    return json({ ok: false, error: "Unknown action." });
  } catch (err) {
    /* Never leak the stack trace to the public site. */
    return json({ ok: false, error: "We could not record that request." });
  } finally {
    lock.releaseLock();
  }
}

/* A plain GET is how you confirm the deployment URL works. */
function doGet() {
  return json({
    ok: true,
    service: "WEA Secretariat register",
    sheet: CONFIG.SHEET_NAME,
    time: new Date().toISOString()
  });
}

/* ---------- actions ---------- */

function submit(payload) {
  var m = payload.member || {};
  if (!m.email) return { ok: false, error: "An email address is required." };

  var sheet = openSheet();
  var existing = findRowById(sheet, m.id) || findRowByEmail(sheet, m.email);

  /* The browser already handed out this membership number, so keep it.
     Re-submitting the same application updates the row instead of
     creating a second one. */
  var cvLink = saveCv(payload.cv);
  var row = buildRow("New application", m, cvLink);

  if (existing) {
    writeRow(sheet, existing, row);
    return { ok: true, duplicate: true, row: existing };
  }
  sheet.appendRow(row);
  return { ok: true, row: sheet.getLastRow() };
}

function update(payload) {
  var m = payload.member || {};
  if (!m.id) return { ok: false, error: "A member ID is required." };

  var sheet = openSheet();
  var at = findRowById(sheet, m.id);
  if (!at) {
    /* Someone edited a profile that never reached the register. */
    var cvLink = payload.cvRemoved ? "" : "";
    sheet.appendRow(buildRow("Profile edit (no prior application)", m, cvLink));
    return { ok: true, created: true, row: sheet.getLastRow() };
  }

  var previousCv = String(sheet.getRange(at, HEADERS.indexOf("CV") + 1).getValue() || "");
  var cvLink = previousCv;
  if (payload.cvRemoved) cvLink = "";
  writeRow(sheet, at, buildRow("Profile edit", m, cvLink));
  return { ok: true, row: at };
}

/* ---------- sheet helpers ---------- */

function openSheet() {
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = book.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(CONFIG.SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function buildRow(event, m, cvLink) {
  var cells = {};
  cells["Timestamp"] = new Date();
  cells["Event"] = event;
  cells["Status"] = m.status === "verified" ? "Verified" : "Pending";
  cells["Member ID"] = m.id || "";
  cells["Code"] = m.code || "";
  cells["Full name"] = m.name || "";
  cells["Email"] = m.email || "";
  cells["Phone"] = m.phone || "";
  cells["Country"] = m.country || "";
  cells["City"] = m.city || "";
  cells["Venture"] = m.company || "";
  cells["Role"] = m.role || "";
  cells["Industry"] = m.industry || "";
  cells["Website"] = m.website || "";
  cells["Class"] = m.tierName || m.tier || "";
  cells["Joined"] = m.joined || "";
  cells["Referred by"] = m.ref || "";
  cells["Socials"] = m.socials || "";
  cells["Notes"] = m.notes || "";
  cells["CV"] = cvLink || "";

  return HEADERS.map(function (h) {
    return cells[h];
  });
}

function writeRow(sheet, rowNumber, values) {
  sheet.getRange(rowNumber, 1, 1, values.length).setValues([values]);
}

function findRowById(sheet, id) {
  return findRow(sheet, 4, id); /* "Member ID" is the 4th column */
}

function findRowByEmail(sheet, email) {
  return findRow(sheet, 7, String(email || "").toLowerCase()); /* "Email" is 7th */
}

function findRow(sheet, column, needle) {
  if (!needle) return 0;
  var last = sheet.getLastRow();
  if (last < 2) return 0;
  var values = sheet.getRange(2, column, last - 1, 1).getValues();
  var target = String(needle).trim().toLowerCase();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim().toLowerCase() === target) {
      return i + 2;
    }
  }
  return 0;
}

function emailExists(email) {
  if (!email) return false;
  return findRowByEmail(openSheet(), email) > 0;
}

/* ---------- Drive ---------- */

function cvFolder() {
  if (CONFIG.CV_FOLDER_ID) {
    var existing = DriveApp.getFolderById(CONFIG.CV_FOLDER_ID);
    if (existing) return existing;
  }
  var named = DriveApp.getFoldersByName("WEA CVs");
  if (named.hasNext()) return named.next();
  return DriveApp.createFolder("WEA CVs");
}

function saveCv(cv) {
  if (!cv || !cv.base64) return "";

  var bytes;
  try {
    bytes = Utilities.base64Decode(cv.base64);
  } catch (err) {
    return "";
  }
  if (!bytes || !bytes.length) return "";
  if (bytes.length > CONFIG.CV_MAX_BYTES) return "";

  var blob = Utilities.newBlob(bytes, cv.mime || "application/pdf", cv.name || "cv.pdf");
  var file = cvFolder().createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  /* Hand back a link the Secretariat can actually click. */
  return "https://drive.google.com/file/d/" + file.getId() + "/view";
}

/* ---------- library ---------- */

function openLibrarySheet() {
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = book.getSheetByName(CONFIG.LIBRARY_SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(CONFIG.LIBRARY_SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(LIBRARY_HEADERS);
    sheet.getRange(1, 1, 1, LIBRARY_HEADERS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function libraryFolder() {
  if (CONFIG.LIBRARY_FOLDER_ID) {
    var existing = DriveApp.getFolderById(CONFIG.LIBRARY_FOLDER_ID);
    if (existing) return existing;
  }
  var named = DriveApp.getFoldersByName("WEA Library");
  if (named.hasNext()) return named.next();
  return DriveApp.createFolder("WEA Library");
}

function safeName(value) {
  return String(value || "file")
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 110) || "file";
}

function saveLibraryFile(payload, kind, book, maxBytes) {
  if (!payload || !payload.base64) return {};
  var bytes;
  try {
    bytes = Utilities.base64Decode(payload.base64);
  } catch (err) {
    return {};
  }
  if (!bytes || !bytes.length || bytes.length > maxBytes) return {};

  var mime = payload.mime || (kind === "pdf" ? "application/pdf" : "image/jpeg");
  if (kind === "pdf" && mime !== "application/pdf") return {};
  if (kind === "cover" && mime.indexOf("image/") !== 0) return {};

  var suffix = kind === "pdf" ? ".pdf" : ".jpg";
  var label = (book.title || "Book") + " — " + (book.author || "Member") +
    (kind === "cover" ? " (cover)" : "");
  var name = safeName(label) + suffix;
  var blob = Utilities.newBlob(bytes, mime, name);
  var file = libraryFolder().createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return {
    id: file.getId(),
    name: name,
    size: bytes.length,
    mime: mime
  };
}

function saveBook(payload) {
  var b = payload.book || {};
  if (!b.title) return { ok: false, error: "A book title is required." };
  if (!b.author) return { ok: false, error: "An author name is required." };
  if (!payload.pdf || !payload.pdf.base64) {
    return { ok: false, error: "A PDF is required." };
  }

  var bookId = String(b.id || ("book-" + Date.now()));
  var sheet = openLibrarySheet();
  var rowNumber = findRow(sheet, 2, bookId); /* "Book ID" is the 2nd column */
  var previousCoverId = "";
  var previousOpens = 0;
  if (rowNumber) {
    var previous = sheet.getRange(rowNumber, 1, 1, LIBRARY_HEADERS.length).getValues()[0];
    previousCoverId = String(previous[10] || "");
    previousOpens = Number(previous[20]) || 0;
  }

  var pdf = saveLibraryFile(payload.pdf, "pdf", b, CONFIG.BOOK_MAX_BYTES);
  if (!pdf.id) {
    return { ok: false, error: "The PDF could not be stored. It may be too large." };
  }

  var cover = saveLibraryFile(payload.cover, "cover", b, CONFIG.COVER_MAX_BYTES);
  var coverId = cover.id || previousCoverId;

  var record = {
    id: bookId,
    title: b.title,
    author: b.author,
    authorBio: b.authorBio || "",
    authorLink: b.authorLink || "",
    category: b.category || "Entrepreneurship",
    year: b.year || "",
    language: b.language || "English",
    description: b.description || "",
    coverId: coverId,
    pdfId: pdf.id,
    pdfName: pdf.name || payload.pdf.name || "book.pdf",
    size: pdf.size || 0,
    uploadedBy: b.uploadedBy || "",
    uploadedByName: b.uploadedByName || "",
    createdAt: b.createdAt || new Date().toISOString(),
    opens: previousOpens
  };

  var row = buildLibraryRow(record);
  if (rowNumber) {
    writeRow(sheet, rowNumber, row);
  } else {
    sheet.appendRow(row);
    rowNumber = sheet.getLastRow();
  }

  var stored = publicBook(record);
  stored.row = rowNumber;
  return { ok: true, book: stored };
}

function buildLibraryRow(record) {
  return [
    new Date(),
    record.id,
    record.title,
    record.author,
    record.authorBio,
    record.authorLink,
    record.category,
    record.year,
    record.language,
    record.description,
    record.coverId,
    coverUrl(record.coverId),
    record.pdfId,
    previewUrl(record.pdfId),
    viewUrl(record.pdfId),
    downloadUrl(record.pdfId),
    record.pdfName,
    record.size,
    record.uploadedByName,
    record.uploadedBy,
    record.opens
  ];
}

function listBooks() {
  var sheet = openLibrarySheet();
  var last = sheet.getLastRow();
  if (last < 2) return [];

  var values = sheet.getRange(2, 1, last - 1, LIBRARY_HEADERS.length).getValues();
  var books = [];
  values.forEach(function (row) {
    var id = String(row[1] || "").trim();
    var title = String(row[2] || "").trim();
    if (!id || !title) return;
    books.push(publicBook({
      id: id,
      title: title,
      author: row[3],
      authorBio: row[4],
      authorLink: row[5],
      category: row[6],
      year: row[7],
      language: row[8],
      description: row[9],
      coverId: row[10],
      pdfId: row[12],
      pdfName: row[16],
      size: row[17],
      uploadedByName: row[18],
      uploadedBy: row[19],
      createdAt: row[0] instanceof Date ? row[0].toISOString() : row[0],
      opens: row[20]
    }));
  });
  return books;
}

function publicBook(record) {
  return {
    id: record.id,
    title: record.title,
    author: record.author,
    authorBio: record.authorBio,
    authorLink: record.authorLink,
    category: record.category,
    year: record.year,
    language: record.language,
    description: record.description,
    coverUrl: coverUrl(record.coverId),
    previewUrl: previewUrl(record.pdfId),
    viewUrl: viewUrl(record.pdfId),
    downloadUrl: downloadUrl(record.pdfId),
    pdfName: record.pdfName,
    size: record.size,
    uploadedBy: record.uploadedBy,
    uploadedByName: record.uploadedByName,
    createdAt: record.createdAt,
    opens: Number(record.opens) || 0
  };
}

function coverUrl(id) {
  if (!id) return "";
  return "https://drive.google.com/thumbnail?id=" + id + "&sz=w800";
}

function previewUrl(id) {
  if (!id) return "";
  return "https://drive.google.com/file/d/" + id + "/preview";
}

function viewUrl(id) {
  if (!id) return "";
  return "https://drive.google.com/file/d/" + id + "/view";
}

function downloadUrl(id) {
  if (!id) return "";
  return "https://drive.google.com/uc?export=download&id=" + id;
}

function markBookOpened(id) {
  if (!id) return { ok: false, error: "A book ID is required." };
  var sheet = openLibrarySheet();
  var rowNumber = findRow(sheet, 2, id);
  if (!rowNumber) return { ok: false, error: "That book was not found." };
  var cell = sheet.getRange(rowNumber, LIBRARY_HEADERS.indexOf("Opens") + 1);
  cell.setValue((Number(cell.getValue()) || 0) + 1);
  return { ok: true };
}

/* ---------- utility ---------- */

function json(result) {
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(
    ContentService.MimeType.JSON
  );
}
