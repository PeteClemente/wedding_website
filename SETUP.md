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

- `details.html` — confirm venue addresses/map links, and add more specific dress code guidance
- `details.html` — fill in real FAQ answers (parking, kids, dietary restrictions)
- `our-story.html` — your story + optional wedding party section
- `gallery.html` — swap placeholder boxes for real `<img>` tags pointing at photos in `assets/img/`
- `registry.html` — real Amazon/Target registry links, and your actual Venmo username (replace `PLACEHOLDER_USERNAME` in the honeymoon fund link)
