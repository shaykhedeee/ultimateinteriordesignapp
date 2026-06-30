# Spacious Venture Public Website

This folder is a GoDaddy-friendly static website package for `spaciousventure.com`.

This is separate from the internal Studio OS software. Do not copy `frontend/`, `server/`, `storage/`, `.env`, or generated assets into the public website host.

## What This Implements

- Lead-generation homepage.
- Sarjapur local SEO page.
- Modular kitchen local SEO page.
- Factory-direct process page.
- Society pages for:
  - Nambiar Millennia
  - Modern Spaaces Engrace
  - Prestige Green Gables
  - SVS Silver Woods
- WhatsApp-first quote flow.
- Mobile zoom allowed through `width=device-width, initial-scale=1`.
- No jQuery, html5shiv, heavy sliders, or abandoned animation plugins.
- Sitemap and robots files.

## GoDaddy Upload

Upload the contents of this folder to the website root:

```text
public-website/
  index.html
  *.html
  styles.css
  script.js
  assets/
  robots.txt
  sitemap.xml
```

Do not upload the parent `public-website` folder itself if GoDaddy expects files inside `public_html` or `httpdocs`.

## Local Preview

From the project root:

```bash
npx http-server public-website -p 8090
```

Then open:

```text
http://127.0.0.1:8090/
```

## Future Better Hosting

Keep GoDaddy for domain and email if preferred. For faster hosting later, move the same folder to Cloudflare Pages or Vercel and point DNS there.

## Boundary Rule

The public website is for lead generation only. The internal studio software lives in the project root under `frontend/`, `server/`, and `storage/`, and should be run privately or behind `STUDIO_ACCESS_TOKEN`.

## Analytics Hooks

The site pushes simple `dataLayer` events:

- `whatsapp_nav_click`
- `hero_quote_click`
- `hero_factory_click`
- `quote_form_submit`
- `floating_whatsapp_click`
- page-specific WhatsApp/quote events

Add Google Tag Manager or GA4 later to capture these events.

## Content Rules

- Replace render images with real approved Spacious Venture project photos when available.
- Keep the 40-day claim worded as "after design and scope sign-off."
- Do not claim final CNC-grade cutlists from the app.
- Use "proposal-stage cutlist" or "production planning preview."
