# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Static marketing site for **CanDen Immigration Services** (Anjali Mehta, RCIC) at `candenimmigration.ca`. Five hand-edited HTML pages plus copied template assets (CSS/JS/img/fonts). Repo: `github.com/jaswanth1998/candenimmigration`, deployed via GitHub Pages (note the recent CNAME add/remove in `git log`).

There is **no build system, no package manager, no tests, no linter**. Edit HTML/CSS/JS directly and open the file in a browser (or run any static server, e.g. `python3 -m http.server 8000`).

## Pages and the duplicated-chunk problem

The site is exactly five top-level HTML files:

- `index.html`, `about.html`, `contact.html`, `resources.html`, `privacy-policy.html`

Each file embeds its own copy of the `<head>` (meta/CSS includes), the header navigation, the footer, and the script tags. **There is no templating.** When you change anything cross-cutting — nav links, footer, password config, a new CSS/JS include, structured-data updates — apply the same edit to all five files. Use `grep -l` to find every copy before editing.

## Password gate (client preview)

Every page boots with this snippet in `<head>` **before** any other script:

```html
<script>window.SITE_PREVIEW_PASSWORD = "ClientPreview2026";</script>
<script src="assets/js/password-protect.js"></script>
```

`assets/js/password-protect.js` blocks rendering with `window.prompt` until the password matches, then stores `canden_preview_unlocked=true` in `sessionStorage`. To rotate the password, edit the inline string on all five pages (not just `password-protect.js`). The `client-changes` branch is the gated preview branch — `main` may or may not include the gate depending on what was last shipped; check before merging.

To bypass locally during development: in the browser console, `sessionStorage.setItem('canden_preview_unlocked','true')` then reload.

## Contact form — the only dynamic piece

`contact.html` has a booking form (`#contactForm`) that:

1. Polls `GET api/get-available-slots.php?t=<ts>` on load and every 30 seconds to populate the jQuery-UI datepicker with available dates.
2. On date pick, calls `GET api/get-available-slots.php?date=YYYY-MM-DD&t=<ts>` to populate the time-slot `<select>`.
3. On submit, re-validates the slot, then `POST api/book-appointment.php` (JSON body: `full_name, email, phone, country_citizenship, current_location, main_objective, appointment_date, appointment_time, message`).
4. Redirects to `thank-you.html` on `result.success === true`.

**Neither the `api/*.php` endpoints nor `thank-you.html` live in this repo.** They are server-side files deployed alongside the static site. Don't try to "fix" 404s for those paths locally — they only exist in production. If you need to change the request/response contract, coordinate with whatever backend owns the PHP files; the JS in `contact.html` (around lines ~1207–1380) is the authoritative client contract.

## Template stack (vendored, not packaged)

All third-party assets are pre-minified copies under `assets/` — there is no `node_modules` and no source for them. Load order in each page matters: jQuery → Bootstrap bundle → Swiper → WOW → odometer → nice-select → imagesloaded → isotope → magnific-popup → jquery-ui → parallax-scroll → `main.js`.

Animations rely on **WOW.js**: elements use classes like `wow skewIn` / `wow fadeInUp` with `data-wow-delay` / `data-wow-duration`. Preserve these attributes when editing markup or animations will silently stop firing. `main.js` wires up WOW, the nice-select dropdowns, Swiper sliders, isotope filtering, and magnific popups — don't reinitialize them inline.

## SEO / structured data

Each page has hand-written JSON-LD blocks (`LocalBusiness`, `Person`, etc.) in `<head>`. If you update contact info (phone, email, address, RCIC name), update **every** JSON-LD block on **every** page in addition to the visible markup — they drift easily.
