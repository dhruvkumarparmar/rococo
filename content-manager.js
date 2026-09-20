(function () {
  "use strict";

  const config = window.ROCOCO_SUPABASE || {};
  const ready = config.url && config.anonKey && !config.url.startsWith("PASTE_") && !config.anonKey.startsWith("PASTE_") && window.supabase;
  if (!ready) return;

  const db = window.supabase.createClient(config.url, config.anonKey);
  const language = () => document.body.dataset.language === "en" ? "en" : "fr";
  const localized = (item, field) => item[`${field}_${language()}`] || item[`${field}_fr`] || item[`${field}_en`] || "";
  let clientWorkItems = [];

  function renderClientWork() {
    const gallery = document.querySelector(".editorial-gallery");
    if (!gallery || !clientWorkItems.length) return;
    const featured = clientWorkItems.slice(0, 4);
    const previewPool = clientWorkItems.length > 4 ? clientWorkItems.slice(4, 7) : clientWorkItems.slice(0, 3);
    const previews = Array.from({ length: 3 }, (_, index) => previewPool[index % previewPool.length]);
    const isEnglish = language() === "en";
    const classes = ["work-a", "work-b", "work-c", "work-d"];
    gallery.innerHTML = featured.map((item, index) => `
      <figure class="work-card ${classes[index % classes.length]}">
        <img src="${escapeAttribute(item.image_url)}" alt="${escapeAttribute(localized(item, "title"))}" loading="lazy">
        <figcaption><span>${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(localized(item, "title"))}</strong></figcaption>
      </figure>`).join("") + `
      <a class="gallery-more-card" href="gallery.html" aria-label="${isEnglish ? "View more photos in the gallery" : "Voir plus de photos dans la galerie"}">
        <span class="gallery-more-preview" aria-hidden="true">
          ${previews.map(item => `<img src="${escapeAttribute(item.image_url)}" alt="" loading="lazy">`).join("")}
        </span>
        <span class="gallery-more-overlay">
          <b aria-hidden="true">+</b>
          <strong>${isEnglish ? "View more photos" : "Voir plus de photos"}</strong>
          <small>${isEnglish ? "Explore the full gallery" : "Explorer la galerie complète"}</small>
        </span>
      </a>`;
  }

  async function loadClientWork() {
    const { data, error } = await db.from("gallery_items").select("*").eq("collection", "client_work").eq("is_visible", true).order("display_order");
    if (error || !data?.length) return;
    clientWorkItems = data;
    renderClientWork();
  }

  async function loadSeasonal() {
    const { data, error } = await db.from("gallery_items").select("*").eq("collection", "seasonal").eq("is_visible", true).order("display_order");
    if (error || !data?.length) return;
    const image = document.querySelector("#fallCollectionVisual img");
    const title = document.querySelector(".fall-collection-tag small");
    const subtitle = document.querySelector(".fall-collection-tag span");
    if (!image || !title || !subtitle) return;
    let index = 0;
    const show = () => {
      const item = data[index];
      image.classList.add("seasonal-switching");
      window.setTimeout(() => {
        image.src = item.image_url;
        image.alt = localized(item, "title");
        title.textContent = localized(item, "title");
        subtitle.textContent = localized(item, "subtitle") || (language() === "en" ? "SEASONAL COLLECTION" : "COLLECTION SAISONNIÈRE");
        image.classList.remove("seasonal-switching");
      }, 220);
    };
    show();
    if (data.length > 1 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.setInterval(() => { index = (index + 1) % data.length; show(); }, 5500);
    }
  }

  async function loadServices() {
    const { data, error } = await db.from("services").select("*").eq("is_visible", true).order("display_order");
    if (error || !data?.length) return;
    const list = document.querySelector(".price-list");
    if (!list) return;
    list.innerHTML = data.map(item => `
      <div class="price-row price-item" data-category="${escapeAttribute(item.category)}">
        <span>${escapeHtml(localized(item, "name"))}</span><i></i><strong>${escapeHtml(localized(item, "price"))}</strong>
      </div>`).join("");
    document.dispatchEvent(new CustomEvent("rococo:services-rendered"));
  }

  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value == null ? "" : String(value);
    return div.innerHTML;
  }
  function escapeAttribute(value) { return escapeHtml(value).replace(/`/g, "&#96;"); }

  async function refresh() {
    await Promise.all([loadClientWork(), loadSeasonal(), loadServices()]);
  }
  document.addEventListener("DOMContentLoaded", refresh);
  document.addEventListener("rococo:language-changed", refresh);
})();
