# Setup Guide

Two things need manual, one-time setup outside of this repo before the site is fully live: the RSVP form's backend, and the custom domain's DNS.

## 1. RSVP form (Google Sheet + Apps Script)

The site is static (GitHub Pages), so RSVP submissions are sent straight from the browser to a small script running on Google's side, which appends them to a Google Sheet you own.

### a) Create the Sheet
1. Create a new Google Sheet, name it something like `Wedding RSVPs`.
2. In row 1, add these headers exactly: `Timestamp | Name | Attending | GuestCount | MealChoice | Notes`

### b) Add the Apps Script
1. In the Sheet, go to **Extensions → Apps Script**.
2. Delete any starter code and paste this in:

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const params = e.parameter;

  sheet.appendRow([
    new Date(),
    params.name || '',
    params.attending || '',
    params.guestCount || '',
    params.mealChoice || '',
    params.notes || '',
  ]);

  return ContentService.createTextOutput('OK');
}
```

3. Click **Save**, then **Deploy → New deployment**.
4. Click the gear icon next to "Select type" and choose **Web app**.
5. Set **Execute as**: `Me`. Set **Who has access**: `Anyone`.
6. Click **Deploy**, authorize the permissions it asks for (this is your own script, so it's safe), and copy the **Web app URL** (it ends in `/exec`).

### c) Connect it to the site
1. Open `assets/js/rsvp.js`.
2. Replace `PASTE_YOUR_APPS_SCRIPT_URL_HERE` with the URL you copied.
3. Commit and push. Test by submitting the RSVP form and confirming a new row appears in the Sheet.

If you ever change the Sheet's header/structure, keep the Apps Script's `sheet.appendRow(...)` order matching your headers.

## 2. Custom domain (peterandmary.com) on GitHub Pages

The repo already has a `CNAME` file containing `peterandmary.com`, so GitHub Pages knows to serve the site there once DNS points at it. `www.peterandmary.com` is set up to redirect in to the apex domain.

### a) DNS records (set these at your domain registrar)
Point the **apex domain** (`peterandmary.com`) at GitHub Pages with four `A` records:

| Type | Host | Value |
|------|------|-------|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |

Point `www` at GitHub Pages with a `CNAME` record:

| Type | Host | Value |
|------|------|-------|
| CNAME | www | `<your-github-username>.github.io` |

(Exact field names vary by registrar — look for "DNS management" or "DNS records".)

### b) GitHub repo settings
1. Go to the repo's **Settings → Pages**.
2. Under "Custom domain", confirm it shows `peterandmary.com` (it should pick this up from the `CNAME` file automatically once merged to the branch Pages serves from).
3. Once DNS has propagated (can take anywhere from a few minutes to 24+ hours), check **Enforce HTTPS** so the site is served securely.

## 3. Content still to fill in

These are marked with 📝 TODO callouts directly on the site so they're easy to find while browsing:

The whole site now lives in `index.html` as one scrolling page, with each nav tab (Schedule, Travel, Registry, Our Story, FAQs) jumping to its own `<section id="...">` there instead of loading a separate page. Look for the section by its `id` when editing:

- `#schedule` — confirm venue addresses/map links, and add more specific dress code guidance
- `#travel` — hotel names/room block codes/booking links, airport, directions, and transportation details
- `#registry` — real Amazon/Target registry links, and your actual Venmo username (replace `PLACEHOLDER_USERNAME` in the honeymoon fund link)
- `#our-story` — your story + optional wedding party section
- `#faq` — fill in real FAQ answers (parking, kids, dietary restrictions)
- Hero section — swap the HollyFace placeholder for the real photo once it's converted to `.jpg` (see note below)

RSVP (`rsvp.html`) and the hidden game (`game.html`) stay as their own separate pages — they're not part of the scrolling sections.

## 4. Site password

The whole site (except `password.html` itself) is gated behind a password, checked client-side in `assets/js/password.js` against a SHA-256 hash — this keeps casual visitors and search engines out, but isn't real security (anyone determined can view-source around it), so don't use it to protect anything sensitive.

Once a guest enters the correct password, `password.html` sets `localStorage.site_unlocked = 'true'` in their browser, and `assets/js/gate.js` (loaded first thing on every other page) checks for that flag before letting the page render, redirecting back to `password.html` if it's missing.

To change the password:
1. Compute the SHA-256 hex digest of the new password, e.g. in Node: `node -e "console.log(require('crypto').createHash('sha256').update('yourpassword').digest('hex'))"`
2. Paste the result into `PASSWORD_HASH` in `assets/js/password.js`.
3. Commit and push.

The current password is `chickencutlets4life`.

## 5. Hidden game

`game.html` (a Memory Match game) isn't linked in the nav — it's an easter egg. Clicking the "&" in the "Peter & Mary" logo 5 times within about 1.5 seconds sends you there. The click handler lives in `assets/js/nav.js`.

## 6. Photos

Photos live in `assets/img/`. Browsers can't display `.heic` files (the default format for iPhone photos), so anything added there needs to be `.jpg` or `.png`. This machine had the free Microsoft "HEIF Image Extensions" installed but it couldn't fully decode the `.heic` files without the paid "HEVC Video Extensions" add-on (~$0.99 on the Microsoft Store) — so 3 files are still stuck as `.heic`:

- `HollyFace.heic` — meant for the framed photo spot on the home page hero (currently a placeholder)
- `IMG_20260822_174442.heic`
- `IMG_20260822_174537.heic`

Easiest fix: re-export/re-share those specific photos as `.jpg` from whatever took them (phone Photos app export, "Save As JPEG", etc.) and drop the `.jpg` back into `assets/img/` with a sensible filename.
