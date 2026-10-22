# Sending applications to a Google Sheet

Right now, membership applications are stored in the visitor's browser
only. If they clear their cache, or apply from a phone and then a laptop,
the Secretariat never sees the record. This folder fixes that.

It takes about ten minutes and costs nothing.

```
Website  ──POST──▶  Apps Script web app  ──▶  Your Google Sheet
                                                   │
                                                   └──▶  CVs to Google Drive
```

Nothing changes for visitors while the Sheet is unset — the site works
exactly as it did before. You switch it on by pasting one URL.

---

## 1. Create the spreadsheet

1. Go to [sheets.new](https://sheets.new) while signed into the Google
   account that should own the register.
2. Name it **WEA — Membership Register**.
3. You can delete the empty "Sheet1" tab — the script creates the tab it
   needs.

## 2. Add the script

1. In the spreadsheet, open **Extensions ▸ Apps Script**.
2. Delete whatever is in `Code.gs`.
3. Paste in the whole contents of [`Code.gs`](./Code.gs) from this folder.
4. Press **Ctrl+S** to save. Call the project **WEA Register** if it asks.

Nothing else needs editing. The defaults create an `Applications` tab and
a `WEA CVs` folder in your Drive automatically. To change them, edit
`CONFIG` at the top of `Code.gs`:

| Setting | Default | What it does |
|---|---|---|
| `SHEET_NAME` | `"Applications"` | The tab rows are written to. |
| `CV_FOLDER_ID` | `""` | Drive folder for uploaded CVs. Empty means "create `WEA CVs`". |
| `CV_MAX_BYTES` | `1.5 MB` | Ceiling on an uploaded CV. Matches the website. |

## 3. Deploy it

1. Click **Deploy ▸ New deployment**.
2. Click the cog ▸ **Web app**.
3. Fill in:
   - **Description:** `WEA website`
   - **Execute as:** **Me** (your account)
   - **Who has access:** **Anyone** ⚠️ — this is the setting that trips
     people up. It does **not** share your spreadsheet. It only means any
     visitor may send the script an application. Only your account can
     read the Sheet.
4. Click **Deploy** and authorise when prompted. Google will warn that the
   app "isn't verified" — that is expected, it is your own script. Choose
   **Advanced ▸ Go to WEA Register (unsafe)**.
5. Copy the **Web app URL**. It looks like:

   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

## 4. Point the website at it

Open `data.js` and paste the URL in:

```js
WEA_DATA.sheet = {
  endpoint: "https://script.google.com/macros/s/AKfycb.../exec"
};
```

Then commit and push. GitHub Pages republishes within a minute.

## 5. Test it

Open the live site, run through **Apply**, and submit a test application
with an obviously fake email. You should see:

- the success panel says **"Sent to the Secretariat register."**
- a new row appears in your Sheet within a few seconds.

Then delete the test row.

You can also check the endpoint directly — paste the Web app URL into
your browser. You should get:

```json
{"ok":true,"service":"WEA Secretariat register","sheet":"Applications","time":"..."}
```

---

## What lands in the Sheet

One row per application, with these columns:

| Column | |
|---|---|
| Timestamp | When it arrived |
| Event | `New application` or `Profile edit` |
| Status | `Pending` until the Secretariat verifies |
| Member ID | e.g. `WEA-2026-000012` |
| Code | The 8-character verification code |
| Full name, Email, Phone, Country, City | |
| Venture, Role, Industry, Website | |
| Class | Associate / Professional / Corporate / Legacy Patron |
| Joined, Referred by, Socials, Notes | |
| CV | A clickable Google Drive link |

**To verify an applicant:** change `Status` from `Pending` to `Verified`.
Their verify page and portal will pick it up next time they visit.

---

## Things worth knowing

**Duplicate applications are blocked across devices.** The site checks the
Sheet before saving, so the same email cannot be used twice even from a
phone and a laptop.

**CVs go to Drive, not the Sheet.** A PDF is far larger than a cell can
hold, so the script files it in Drive and stores only the link. Uploaded
CVs are set to "anyone with the link can view" so the Secretariat can open
them without a sign-in prompt. If you would rather they stay private,
remove the `setSharing` line in `Code.gs` and open them from your Drive.

**Your script runs as you.** Anyone who finds the URL can submit rows, but
nobody can read your Sheet through it — reads always run as your account.
If spam ever becomes a problem, set **Who has access** to *Anyone with a
Google account*, which makes visitors sign in first.

**Edits made directly in the Sheet are not read back.** The website never
reads the Sheet at runtime; it keeps using the browser's local copy for
the verify page and portal. The Sheet is the Secretariat's ledger, not a
two-way database. If you ever want members to see status changes
immediately, that needs a different setup — ask and I will wire it.

**Re-deploy after editing `Code.gs`.** Apps Script does not publish
changes automatically. Click **Deploy ▸ Manage deployments ▸ ✏️ ▸ Version:
New version** after every edit, or your changes will not run.
