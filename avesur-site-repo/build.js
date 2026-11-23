// Builds the site: copies src/ to dist/, then writes English, French (/fr/) and Spanish (/es/)
// pages from the copy in src/assets/js/i18n.js, plus sitemap.xml, robots.txt and _headers.
// Set the Netlify environment variable SITE_LIVE=true at launch to let search engines index the site.
const fs = require("fs"), path = require("path"), cheerio = require("cheerio");
const SRC = path.join(__dirname, "src"), SITE = path.join(__dirname, "dist");
const LIVE = process.env.SITE_LIVE === "true";
// Google Analytics 4: set the Netlify environment variable GA4_ID (e.g. G-XXXXXXXXXX) to add the tag to every page.
const GA4_ID = /^G-[A-Z0-9]+$/.test(process.env.GA4_ID || "") ? process.env.GA4_ID : "";
fs.rmSync(SITE, { recursive: true, force: true });
fs.cpSync(SRC, SITE, { recursive: true });
const BASE = "https://www.avesurconsulting.ca/";
global.window = {};
eval(fs.readFileSync(path.join(SRC, "assets/js/i18n.js"), "utf8"));
const DICT = window.AVESUR_I18N;
const PAGES = ["index.html", "services.html", "how-we-work.html", "about.html", "contact.html"];
const LANGS = { en: { html: "en-CA", og: "en_CA", dir: "" }, fr: { html: "fr-CA", og: "fr_CA", dir: "fr/" }, es: { html: "es-MX", og: "es_MX", dir: "es/" } };

const META = {
  fr: {
    "index.html": ["Avesur Consulting | Évaluation indépendante, conformité et accès aux marchés",
      "Évaluation indépendante, conformité et accès aux marchés au Canada, au Mexique et aux États-Unis. Nous cernons les exigences et vous aidons à les franchir."],
    "services.html": ["Services : évaluation, conformité, accès aux marchés et approvisionnement | Avesur Consulting",
      "Analyse des débouchés, audit et assurance, conformité réglementaire, accès aux marchés transfrontaliers, marchés publics et automatisation de la conformité."],
    "about.html": ["À propos d'Avesur Consulting | Basée à Ottawa, dirigée par une femme, fondée en 2011",
      "Avesur Consulting Inc. : firme d'Ottawa canadienne, dirigée par une femme et fondée en 2011, spécialisée en validation indépendante, assurance et conformité."],
    "how-we-work.html": ["Notre méthode | Méthodologie d'évaluation d'Avesur Consulting",
      "Notre processus en six phases, nos cadres d'évaluation (NIST, ITSG-33, EMR-1, ISO 19011, ISO/IEC 17065) et comment nous rendons les normes mesurables."],
    "contact.html": ["Joindre Avesur Consulting | Réserver une consultation",
      "Dites-nous ce que vous voulez accomplir. Consultation sur les évaluations, la conformité, l'accès aux marchés, les marchés publics ou la sous-traitance."]
  },
  es: {
    "index.html": ["Avesur Consulting | Evaluación independiente, cumplimiento y acceso a mercados",
      "Evaluación independiente, cumplimiento y acceso a mercados en Canadá, México y Estados Unidos. Identificamos los requisitos y le ayudamos a cumplirlos."],
    "services.html": ["Servicios: evaluación, cumplimiento, acceso a mercados y compras públicas | Avesur Consulting",
      "Análisis de mercado, auditoría y aseguramiento, cumplimiento regulatorio, entrada a mercados, preparación para compras públicas y automatización."],
    "about.html": ["Acerca de Avesur Consulting | Con sede en Ottawa, liderada por una mujer, desde 2011",
      "Avesur Consulting Inc.: firma de Ottawa, 100 % canadiense y liderada por una mujer, fundada en 2011, especializada en validación independiente y cumplimiento."],
    "how-we-work.html": ["Cómo Trabajamos | Metodología de evaluación de Avesur Consulting",
      "Nuestro proceso de seis fases, los marcos con que evaluamos (NIST, ITSG-33, TRA-1, ISO 19011, ISO/IEC 17065) y cómo convertimos normas en pruebas medibles."],
    "contact.html": ["Contacto Avesur Consulting | Agende una consulta",
      "Cuéntenos qué quiere lograr. Agende una consulta sobre evaluaciones, cumplimiento, entrada a mercados, compras públicas o contratación principal."]
  }
};

// public URLs have no .html extension (Netlify serves services.html at /services)
const clean = page => page === "index.html" ? "" : page.replace(/\.html$/, "");
const urlFor = (lang, page) => BASE + LANGS[lang].dir + clean(page);
// relative link from (fromLang) page to (toLang) page
const rel = (from, to, page) => ((from === "en" ? "" : "../") + LANGS[to].dir + clean(page)) || "./";
const fixPath = v => v.replace(/(^|[\s,])(assets\/|favicon\.ico|site\.webmanifest)/g, "$1../$2");

for (const page of PAGES) {
  const src = fs.readFileSync(path.join(SRC, page), "utf8");
  for (const lang of Object.keys(LANGS)) {
    const $ = cheerio.load(src, { decodeEntities: false });
    const d = DICT[lang];
    if (lang !== "en") {
      $("[data-i18n]").each((_, el) => { const v = d[$(el).attr("data-i18n")]; if (v) $(el).html(v); });
      $("[data-i18n-ph]").each((_, el) => { const v = d[$(el).attr("data-i18n-ph")]; if (v) $(el).attr("placeholder", v); });
      $("[data-i18n-aria]").each((_, el) => { const v = d[$(el).attr("data-i18n-aria")]; if (v) $(el).attr("aria-label", v); });
      $("[data-i18n-alt]").each((_, el) => { const v = d[$(el).attr("data-i18n-alt")]; if (v) $(el).attr("alt", v); });
      const [t, desc] = META[lang][page];
      $("title").text(t);
      $('meta[name="description"]').attr("content", desc);
      $('meta[property="og:title"]').attr("content", t);
      $('meta[property="og:description"]').attr("content", desc);
      ["href", "src", "srcset", "imagesrcset"].forEach(a => $(`[${a}]`).each((_, el) => { $(el).attr(a, fixPath($(el).attr(a))); }));
      $("[style]").each((_, el) => { $(el).attr("style", $(el).attr("style").replace(/url\((['"]?)assets\//g, "url($1../assets/")); });
    }
    $("html").attr("lang", LANGS[lang].html);
    $('link[rel="canonical"]').attr("href", urlFor(lang, page));
    $('meta[property="og:url"]').attr("content", urlFor(lang, page));
    $('meta[property="og:locale"]').attr("content", LANGS[lang].og);
    $('meta[property="og:locale:alternate"]').remove();
    let alt = Object.keys(LANGS).filter(l => l !== lang).map(l => `\n  <meta property="og:locale:alternate" content="${LANGS[l].og}">`).join("");
    alt += Object.keys(LANGS).map(l => `\n  <link rel="alternate" hreflang="${LANGS[l].html}" href="${urlFor(l, page)}">`).join("");
    alt += `\n  <link rel="alternate" hreflang="x-default" href="${urlFor("en", page)}">`;
    $('meta[property="og:locale"]').after(alt);
    // language switcher becomes real links
    $(".lang-switch").html(Object.keys(LANGS).map(l =>
      `<a href="${rel(lang, l, page)}" hreflang="${LANGS[l].html}" lang="${l}"${l === lang ? ' aria-current="true"' : ""}>${l.toUpperCase()}</a>`).join(""));
    // no runtime translation needed
    $('script[src$="i18n.js"]').remove();
    if (LIVE) { $('meta[name="robots"]').remove(); }
    if (GA4_ID) {
      $("head").append(`\n  <script async src="https://www.googletagmanager.com/gtag/js?id=${GA4_ID}"></script>\n` +
        `  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config","${GA4_ID}");</script>\n`);
    }
    const out = path.join(SITE, LANGS[lang].dir, page);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, $.html());
  }
}

// sitemap with hreflang alternates
let sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';
for (const page of PAGES) for (const lang of Object.keys(LANGS)) {
  sm += `  <url>\n    <loc>${urlFor(lang, page)}</loc>\n`;
  for (const l of Object.keys(LANGS)) sm += `    <xhtml:link rel="alternate" hreflang="${LANGS[l].html}" href="${urlFor(l, page)}"/>\n`;
  sm += `    <xhtml:link rel="alternate" hreflang="x-default" href="${urlFor("en", page)}"/>\n  </url>\n`;
}
fs.writeFileSync(path.join(SITE, "sitemap.xml"), sm + "</urlset>\n");
fs.writeFileSync(path.join(SITE, "robots.txt"), LIVE ? `User-agent: *\nAllow: /\nSitemap: ${BASE}sitemap.xml\n` : "User-agent: *\nDisallow: /\n");
fs.writeFileSync(path.join(SITE, "_headers"), (LIVE ? "" : "/*\n  X-Robots-Tag: noindex, nofollow\n") +
  "/assets/*\n  Cache-Control: public, max-age=604800\n");
console.log("Built " + PAGES.length * 3 + " pages" + (LIVE ? " (live)" : " (noindex)") + (GA4_ID ? ", GA4 " + GA4_ID : ", no GA4"));
