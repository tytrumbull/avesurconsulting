/* Avesur Consulting — shared behaviour: language, theme, navigation, scrollspy, contact form */
(function () {
  "use strict";

  var DICT = window.AVESUR_I18N || {};
  var LANG_KEY = "avesur_selected_lang";
  var THEME_KEY = "avesur_selected_theme";
  var HTML_LANG = { en: "en-CA", fr: "fr-CA", es: "es-MX" };

  function store(key, value) {
    try { if (value === undefined) { return localStorage.getItem(key); } localStorage.setItem(key, value); } catch (e) { return null; }
    return null;
  }

  /* ---------- language ---------- */
  function setLanguage(lang) {
    if (!DICT[lang]) { lang = "en"; }
    var dict = DICT[lang];
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var v = dict[el.getAttribute("data-i18n")];
      if (v) { el.innerHTML = v; }
    });
    document.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
      var v = dict[el.getAttribute("data-i18n-ph")];
      if (v) { el.setAttribute("placeholder", v); }
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      var v = dict[el.getAttribute("data-i18n-aria")];
      if (v) { el.setAttribute("aria-label", v); }
    });
    document.querySelectorAll(".lang-switch button").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-lang") === lang ? "true" : "false");
    });
    document.documentElement.lang = HTML_LANG[lang];
    store(LANG_KEY, lang);
  }

  /* ---------- theme ---------- */
  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    store(THEME_KEY, theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) { meta.setAttribute("content", theme === "light" ? "#f5f7fa" : "#0f1a2c"); }
  }

  document.addEventListener("DOMContentLoaded", function () {
    /* each language has its own static page (/, /fr/, /es/); the switcher is plain links */

    var themeBtn = document.getElementById("theme-toggle");
    if (themeBtn) {
      themeBtn.addEventListener("click", function () {
        setTheme(document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light");
      });
    }

    /* ---------- mobile menu ---------- */
    var menuBtn = document.getElementById("menu-toggle");
    var nav = document.getElementById("primary-nav");
    function closeMenu() { if (nav) { nav.classList.remove("is-open"); menuBtn.setAttribute("aria-expanded", "false"); } }
    if (menuBtn && nav) {
      menuBtn.addEventListener("click", function () {
        var open = nav.classList.toggle("is-open");
        menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      });
      nav.addEventListener("click", function (e) { if (e.target.closest("a")) { closeMenu(); } });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeMenu(); } });
    }

    /* ---------- header shadow once the page scrolls ---------- */
    var header = document.querySelector(".site-header");
    function onScroll() { if (header) { header.classList.toggle("is-scrolled", window.scrollY > 8); } }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    /* ---------- method sequence (home): plays once when scrolled into view ---------- */
    var method = document.querySelector(".method");
    if (method) {
      if ("IntersectionObserver" in window) {
        var mo = new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting) { method.classList.add("is-run"); mo.disconnect(); }
        }, { threshold: 0.4 });
        mo.observe(method);
      } else { method.classList.add("is-run"); }
    }

    /* ---------- services sub-nav scrollspy ---------- */
    var spyLinks = document.querySelectorAll(".subnav a");
    if (spyLinks.length && "IntersectionObserver" in window) {
      var byId = {};
      spyLinks.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            spyLinks.forEach(function (a) { a.classList.remove("is-active"); a.removeAttribute("aria-current"); });
            var link = byId[en.target.id];
            if (link) {
              link.classList.add("is-active"); link.setAttribute("aria-current", "true");
              /* slide the tab strip sideways only; never move the page */
              var strip = link.closest("ul");
              if (strip && strip.scrollWidth > strip.clientWidth) {
                strip.scrollTo({ left: link.offsetLeft - 24, behavior: "smooth" });
              }
            }
          }
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      Object.keys(byId).forEach(function (id) { var s = document.getElementById(id); if (s) { io.observe(s); } });
    }

    /* ---------- contact form ---------- */
    var form = document.getElementById("inquiry-form");
    if (form) {
      var select = document.getElementById("inquiry_type");
      var wanted = new URLSearchParams(window.location.search).get("service");
      if (wanted && select && select.querySelector('option[value="' + wanted + '"]')) { select.value = wanted; }

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!form.reportValidity()) { return; }
        var ok = document.getElementById("form-status"), err = document.getElementById("form-error");
        var btn = form.querySelector('button[type="submit"]');
        if (btn) { btn.disabled = true; }
        fetch("/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams(new FormData(form)).toString()
        }).then(function (r) {
          if (!r.ok) { throw new Error(r.status); }
          form.reset(); if (err) { err.hidden = true; } if (ok) { ok.hidden = false; ok.focus(); }
        }).catch(function () {
          if (err) { err.hidden = false; err.focus(); }
        }).then(function () { if (btn) { btn.disabled = false; } });
      });
    }

    var year = document.getElementById("year");
    if (year) { year.textContent = String(new Date().getFullYear()); }
  });
})();
