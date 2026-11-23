# Avesur Consulting website

Edit the English pages in `src/` and all copy (EN/FR/ES) in `src/assets/js/i18n.js`.
Netlify runs `npm run build`, which writes the English, `/fr/` and `/es/` pages to `dist/`.

Local preview: `npm install && npm run build`, then serve `dist/` (e.g. `npx serve dist`). Links use clean URLs (`/services`, not `/services.html`), so opening files directly won't navigate.

## Launch checklist
1. Netlify > Site configuration > Environment variables: add `SITE_LIVE` = `true`, then redeploy.
   This removes noindex and opens robots.txt.
2. Netlify > Forms > inquiry > Form notifications: email to info@avesurconsulting.ca.
3. Add the custom domain in Netlify; at the DNS host point `@` and `www` to Netlify. Leave MX/email records alone.
4. Submit https://www.avesurconsulting.ca/sitemap.xml in Google Search Console.
5. Google Analytics: create a GA4 property, then add the Netlify environment variable `GA4_ID` (e.g. `G-XXXXXXXXXX`) and redeploy. The build adds the tag to every page.
6. Microsoft Clarity: create a project at clarity.microsoft.com, then add the Netlify environment variable `CLARITY_ID` with the project ID (Clarity > Settings > Overview) and redeploy.
