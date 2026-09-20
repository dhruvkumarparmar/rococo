(function () {
  "use strict";

  const config = window.ROCOCO_SUPABASE || {};
  const grid = document.getElementById("fullGallery");
  const count = document.getElementById("galleryCount");
  const dialog = document.getElementById("galleryLightbox");
  const lightboxImage = document.getElementById("lightboxImage");
  const lightboxTitle = document.getElementById("lightboxTitle");
  const lightboxIndex = document.getElementById("lightboxIndex");
  const languageButtons = [...document.querySelectorAll("[data-gallery-language]")];
  let currentLanguage = "fr";
  let items = [];
  let activeIndex = 0;

  function preferredLanguage() {
    try {
      const saved = localStorage.getItem("rococo-language");
      if (saved === "fr" || saved === "en") return saved;
    } catch (_) {}
    return (navigator.language || "").toLowerCase().startsWith("en") ? "en" : "fr";
  }

  function localized(item, field) {
    return item[`${field}_${currentLanguage}`] || item[`${field}_fr`] || item[`${field}_en`] || "";
  }

  function setLanguage(language, remember = true) {
    currentLanguage = language === "en" ? "en" : "fr";
    document.documentElement.lang = currentLanguage === "en" ? "en-CA" : "fr-CA";
    document.body.dataset.language = currentLanguage;
    document.querySelectorAll("[data-fr][data-en]").forEach(element => {
      element.textContent = element.dataset[currentLanguage];
    });
    languageButtons.forEach(button => {
      const active = button.dataset.galleryLanguage === currentLanguage;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    if (remember) {
      try { localStorage.setItem("rococo-language", currentLanguage); } catch (_) {}
    }
    renderGallery();
    if (dialog.open) showLightbox(activeIndex);
  }

  function escapeHtml(value) {
    const element = document.createElement("div");
    element.textContent = value == null ? "" : String(value);
    return element.innerHTML;
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, "&#96;");
  }

  function fallbackItems() {
    return [...grid.querySelectorAll(".gallery-tile")].map(tile => ({
      image_url: tile.dataset.image,
      title_fr: tile.dataset.titleFr,
      title_en: tile.dataset.titleEn
    }));
  }

  function tileClass(index) {
    if (index % 6 === 0) return "tile-tall";
    if (index % 6 === 2) return "tile-wide";
    return "";
  }

  function renderGallery() {
    if (!items.length) return;
    count.textContent = String(items.length).padStart(2, "0");
    grid.innerHTML = items.map((item, index) => {
      const title = localized(item, "title");
      return `<button class="gallery-tile ${tileClass(index)}" type="button" data-gallery-index="${index}" aria-label="${escapeAttribute(title)}">
        <img src="${escapeAttribute(item.image_url)}" alt="${escapeAttribute(title)}" loading="${index < 2 ? "eager" : "lazy"}">
        <span><small>${String(index + 1).padStart(2, "0")}</small><strong>${escapeHtml(title)}</strong></span>
      </button>`;
    }).join("");
    grid.querySelectorAll("[data-gallery-index]").forEach(button => {
      button.addEventListener("click", () => openLightbox(Number(button.dataset.galleryIndex)));
    });
  }

  function openLightbox(index) {
    activeIndex = index;
    showLightbox(index);
    dialog.showModal();
  }

  function showLightbox(index) {
    if (!items.length) return;
    activeIndex = (index + items.length) % items.length;
    const item = items[activeIndex];
    const title = localized(item, "title");
    lightboxImage.src = item.image_url;
    lightboxImage.alt = title;
    lightboxTitle.textContent = title;
    lightboxIndex.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`;
  }

  async function loadGallery() {
    items = fallbackItems();
    renderGallery();
    const ready = config.url && config.anonKey && !config.url.startsWith("PASTE_") && !config.anonKey.startsWith("PASTE_") && window.supabase;
    if (!ready) return;
    const db = window.supabase.createClient(config.url, config.anonKey);
    const { data, error } = await db.from("gallery_items").select("*").eq("collection", "client_work").eq("is_visible", true).order("display_order");
    if (!error && data?.length) {
      items = data;
      renderGallery();
    }
  }

  languageButtons.forEach(button => button.addEventListener("click", () => {
    setLanguage(button.dataset.galleryLanguage);
    const nav = document.getElementById("galleryNav");
    if (nav?.classList.contains("show") && window.bootstrap?.Collapse) {
      window.bootstrap.Collapse.getOrCreateInstance(nav).hide();
    }
  }));
  document.getElementById("closeLightbox").addEventListener("click", () => dialog.close());
  document.getElementById("previousImage").addEventListener("click", () => showLightbox(activeIndex - 1));
  document.getElementById("nextImage").addEventListener("click", () => showLightbox(activeIndex + 1));
  dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
  document.addEventListener("keydown", event => {
    if (!dialog.open) return;
    if (event.key === "ArrowLeft") showLightbox(activeIndex - 1);
    if (event.key === "ArrowRight") showLightbox(activeIndex + 1);
  });

  document.getElementById("galleryYear").textContent = new Date().getFullYear();
  setLanguage(preferredLanguage(), false);
  loadGallery();
})();
