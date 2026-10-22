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
  CV_MAX_BYTES: 1.5 * 1024 * 1024
};

var HEADERS = [
  "Timestamp", "Event", "Status", "Member ID", "Code", "Full name",
  "Email", "Phone", "Country", "City", "Venture", "Role", "Industry",
  "Website", "Class", "Joined", "Referred by", "Socials", "Notes", "CV"
];

/* ---------- entry points ---------- */

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); /* one writer at a time, or rows collide */
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
    return json({ ok: false, error: "Unknown action." });
  } catch (err) {
    /* Never leak the stack trace to the public site. */
    return json({ ok: false, error: "We could not record that application." });
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

/* ---------- utility ---------- */

function json(result) {
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(
    ContentService.MimeType.JSON
  );
}
