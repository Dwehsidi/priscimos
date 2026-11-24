# Priscimos Enterprise Solutions LLC (DBA PEG Solutions) website

Static website for **priscimosenterprise.net**, plus the refreshed logo package.

```
site/    everything that goes on the web server (upload the *contents* of this folder)
brand/   logo files (SVG + PNG), favicons, and the one-page brand sheet
```

The site is plain HTML, CSS and JavaScript, with no build step or framework. Fonts are self-hosted, so it makes no calls to Google or any other third party.

## Pages

| File | Page |
|---|---|
| `index.html` | Home, in the reference site's order: top bar, hero, trust strip, about ("More Than Just a Courier"), services, the difference (certifications + 4 pillars), vehicles, coverage area with map, quote request, closing call to action |
| `medical-courier.html` | Medical courier service |
| `non-medical-courier.html` | Non-medical courier service |
| `custom-courier-solutions.html` | Other / custom requests |
| `privacy.html` | Privacy policy (plain-language starter) |
| `thank-you.html` | Shown after a form is sent without JavaScript |
| `404.html` | Not-found page |

The quote form appears on the home page and on each service page. Its "Service needed" list has Medical courier, Non-medical courier and Other / custom. Service pages preselect their own service. Links can also preselect one with `?service=medical`, `?service=non-medical` or `?service=custom`.

## Confirm these with the client before launch

1. **Email address.** The brief left email blank, so the site uses `info@priscimosenterprise.net` everywhere. Either create that mailbox, or search all files for `info@priscimosenterprise.net` and replace it (this includes `quote.php`).
2. **County count.** The brief says 30 counties but lists 29, so the site says 29. If a county is missing, the list, the count and the map all need updating. The map is drawn from census county shapes, so send the missing county name and it can be regenerated.
3. **Street address.** The full address (18505 Golden Eagle Way) appears in the contact section, the footer and the privacy page. If it's a home address, the client may prefer to show only "Elgin, TX 78621".
4. **Certification wording.** The one-line descriptions of HIPAA / BBP, TSA and DOT are written from the brief; have the client confirm they're accurate.
5. **Privacy policy.** A short starter policy; the client should review it.

## Deploying

### Option A: cPanel / shared hosting with PHP (recommended; the form works as-is)
1. Upload the **contents** of `site/` into `public_html/`, including the hidden `.htaccess` file.
2. Create the mailbox that receives quotes (see item 1 above). In `quote.php`, `$FROM_EMAIL` should be an address on the same domain; `website@priscimosenterprise.net` is fine even if it's only an alias.
3. Turn on SSL (AutoSSL / Let's Encrypt in cPanel), then in `.htaccess` remove the `#` from the two "force HTTPS" lines.
4. Send a test quote from the live site.

### Option B: GitHub Pages (current live setup)
The repo deploys `site/` automatically via `.github/workflows/pages.yml` on every push to `main`.
- Live at **https://dwehsidi.github.io/priscimos/** until the custom domain is connected.
- The quote form posts to FormSubmit (`https://formsubmit.co/ajax/info@priscimosenterprise.net`), since `quote.php` can't run on Pages. The **first** submission sends a one-time activation email to that inbox; click it, or quotes won't be delivered. To change the recipient, replace the address in the `action` of the four forms (`index.html` and the three service pages).
- **Connecting priscimosenterprise.net:** move `CNAME.custom-domain` to `site/CNAME`, push, then at the registrar add A records for `185.199.108.153`, `185.199.109.153`, `185.199.110.153` and `185.199.111.153`, plus a `www` CNAME to `dwehsidi.github.io`. Then tick "Enforce HTTPS" under Settings → Pages.
- `.htaccess` and `quote.php` are ignored on Pages, which is fine.

## After launch
- Add the site in Google Search Console and submit `https://priscimosenterprise.net/sitemap.xml`.
- Set up or claim the Google Business Profile using exactly the same name, address and phone as the site.
- Business details are also in the structured data (`<script type="application/ld+json">`) on the home page, so search engines read them consistently.

## Editing notes
- **Vehicle photo:** the "On the road" section shows a branded placeholder until you add a photo. Save a landscape photo of the client's vehicle as `site/assets/img/fleet.jpg` (about 1600×1200), then in `index.html` remove the comment marks around the `fleet.jpg` image line.
- Colours and fonts are CSS variables at the top of `site/assets/css/styles.css`.
- Phone, email and address appear on every page (header, footer, quote section); use find-and-replace across `site/`.
- The quote form doesn't collect health information, and a note on the form asks people not to include any.
- The hero swoosh draws in once on page load; visitors who have reduced motion turned on in their device settings won't see the animation.

## Credits and licences
- Fonts: DM Serif Display and Overpass, SIL Open Font License 1.1 (licence files in `site/assets/fonts/`).
- Icons: Lucide (ISC licence), embedded as inline SVG.
- Coverage map: US Census Bureau county boundaries via the `us-atlas` package.
