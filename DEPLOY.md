# ROCOCO — Deployment Guide

This folder is ready for static hosting.

## Recommended fastest deployment: Netlify
1. Create/log in to Netlify.
2. Drag the entire `ROCOCO-PRODUCTION` folder into Netlify Drop, or connect a Git repository.
3. No build command is required.
4. Publish directory is the project root (`.`).
5. After your domain is connected, add that final public URL as a canonical URL and `og:url` in `index.html`.

## GitHub Pages
Upload all files in this folder to the root of a GitHub repository and enable GitHub Pages from the repository settings. No build step is needed.

## Vercel
Import the folder/repository as a static site. Framework preset can be `Other`; no build command is required.

## Before public launch
The site is technically deployable now, but replace these business-content placeholders as soon as the real information is available:
- Team portrait images and exact staff names.
- Example testimonial copy with genuine, permissioned customer reviews.
- Exact Instagram/Facebook links.
- Exact public salon address, if you want it shown.
- Confirm the business phone number. The previous phone number looked inconsistent with a Québec business, so it has been removed from this production build.
- Replace demonstration gallery images with authorized ROCOCO client work.
- Connect a real booking provider if desired. The current form opens an email draft.

## Domain SEO
Once a final domain exists:
- Add `<link rel="canonical" href="https://YOURDOMAIN/">`.
- Add `<meta property="og:url" content="https://YOURDOMAIN/">`.
- Create `sitemap.xml` using the real domain.
- Add the site to Google Search Console and Bing Webmaster Tools.

## Tech
- HTML5
- Bootstrap 5.3.8
- CSS3
- Vanilla JavaScript
- Google Fonts
