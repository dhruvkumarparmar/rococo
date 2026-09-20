(function () {
  "use strict";
  const cfg = window.ROCOCO_SUPABASE || {};
  const configured = cfg.url && cfg.anonKey && !cfg.url.startsWith("PASTE_") && !cfg.anonKey.startsWith("PASTE_") && window.supabase;
  const setupState = document.getElementById("setupState");
  const loginView = document.getElementById("loginView");
  const dashboardView = document.getElementById("dashboardView");
  const sessionCheck = document.getElementById("sessionCheck");
  const isLoginPage = !!loginView;
  const isDashboardPage = !!dashboardView;
  const loginUrl = isDashboardPage ? "../admin.html" : "admin.html";
  const dashboardUrl = isLoginPage ? "dashboard/" : "./";
  let dashboardLoaded = false;
  if (!configured) {
    if (setupState) setupState.hidden = false;
    else window.location.replace(loginUrl);
    return;
  }

  const db = window.supabase.createClient(cfg.url, cfg.anonKey);
  const state = { panel: "client-work", records: [] };
  const panelInfo = {
    "client-work": { title: "Galerie", description: "Ajoutez, modifiez, masquez ou supprimez les photos de la galerie.", addLabel: "+ Ajouter une photo", table: "gallery_items", collection: "client_work", image: true },
    seasonal: { title: "Collections saisonnières", description: "Gérez les visuels et les noms des collections saisonnières.", addLabel: "+ Ajouter", table: "gallery_items", collection: "seasonal", image: true },
    services: { title: "Tarifs", description: "Gérez les services, les catégories et les prix affichés sur le site.", addLabel: "+ Ajouter", table: "services", image: false }
  };

  const $ = id => document.getElementById(id);
  if ($("loginEmail")) $("loginEmail").value = cfg.ownerEmail || "";

  $("loginForm")?.addEventListener("submit", async event => {
    event.preventDefault();
    const email = $("loginEmail").value.trim().toLowerCase();
    if (cfg.ownerEmail && email !== cfg.ownerEmail.toLowerCase()) {
      $("loginMessage").textContent = "Ce compte n’est pas autorisé."; return;
    }
    setBusy($("loginForm").querySelector("button"), true, "Connexion…");
    const { error } = await db.auth.signInWithPassword({ email, password: $("loginPassword").value });
    setBusy($("loginForm").querySelector("button"), false, "Se connecter");
    $("loginMessage").textContent = error ? "Courriel ou mot de passe incorrect." : "";
  });

  $("logoutButton")?.addEventListener("click", async () => {
    await db.auth.signOut();
    window.location.replace(loginUrl);
  });
  document.querySelectorAll(".admin-tab").forEach(button => button.addEventListener("click", () => selectPanel(button.dataset.panel)));
  $("addButton")?.addEventListener("click", () => openEditor());
  $("closeDialog")?.addEventListener("click", closeEditor);
  $("cancelDialog")?.addEventListener("click", closeEditor);
  $("imageFile")?.addEventListener("change", previewFile);
  $("editorForm")?.addEventListener("submit", saveRecord);
  $("editorDialog")?.addEventListener("click", event => { if (event.target === $("editorDialog")) closeEditor(); });

  db.auth.onAuthStateChange((_event, session) => showSession(session));
  db.auth.getSession().then(({ data }) => showSession(data.session));

  function showSession(session) {
    const allowed = session?.user?.email?.toLowerCase() === cfg.ownerEmail?.toLowerCase();
    if (isLoginPage) {
      if (setupState) setupState.hidden = true;
      if (allowed) { window.location.replace(dashboardUrl); return; }
      loginView.hidden = false;
      if (session) db.auth.signOut();
      return;
    }
    if (isDashboardPage) {
      if (!allowed) { window.location.replace(loginUrl); return; }
      dashboardView.hidden = false;
      if (sessionCheck) sessionCheck.hidden = true;
      if (!dashboardLoaded) { dashboardLoaded = true; loadRecords(); }
    }
  }

  async function selectPanel(panel) {
    state.panel = panel;
    document.querySelectorAll(".admin-tab").forEach(button => button.classList.toggle("active", button.dataset.panel === panel));
    $("panelTitle").textContent = panelInfo[panel].title;
    $("panelDescription").textContent = panelInfo[panel].description;
    $("addButton").textContent = panelInfo[panel].addLabel;
    await loadRecords();
  }

  async function loadRecords() {
    const info = panelInfo[state.panel];
    $("itemsGrid").innerHTML = '<div class="empty-state">Chargement…</div>';
    let query = db.from(info.table).select("*").order("display_order");
    if (info.collection) query = query.eq("collection", info.collection);
    const { data, error } = await query;
    if (error) { showNotice(error.message, true); return; }
    state.records = data || [];
    renderRecords();
  }

  function renderRecords() {
    const grid = $("itemsGrid");
    if (!state.records.length) { grid.innerHTML = '<div class="empty-state">Aucun élément. Utilisez « + Ajouter » pour commencer.</div>'; return; }
    grid.innerHTML = state.records.map(record => panelInfo[state.panel].image ? imageCard(record) : serviceCard(record)).join("");
    grid.querySelectorAll("[data-edit]").forEach(button => button.addEventListener("click", () => openEditor(state.records.find(row => row.id === button.dataset.edit))));
    grid.querySelectorAll("[data-delete]").forEach(button => button.addEventListener("click", () => deleteRecord(state.records.find(row => row.id === button.dataset.delete))));
  }

  function imageCard(item) {
    return `<article class="admin-item"><img class="admin-item-image" src="${attr(displayImageUrl(item.image_url))}" alt=""><div class="admin-item-body"><h3>${html(item.title_fr)}</h3><p>${html(item.title_en || "—")}</p><div class="admin-item-meta"><span>Ordre ${item.display_order}</span><span class="status-pill ${item.is_visible ? "" : "hidden"}">${item.is_visible ? "Visible" : "Masqué"}</span></div><div class="item-actions"><button data-edit="${item.id}">Modifier</button><button class="delete-button" data-delete="${item.id}">Supprimer</button></div></div></article>`;
  }
  function serviceCard(item) {
    return `<article class="admin-item service-item"><div class="admin-item-body"><p>${html(categoryLabel(item.category))}</p><h3>${html(item.name_fr)}</h3><p>${html(item.name_en || "—")}</p><div class="service-price">${html(item.price_fr)}</div><div class="admin-item-meta"><span>Ordre ${item.display_order}</span><span class="status-pill ${item.is_visible ? "" : "hidden"}">${item.is_visible ? "Visible" : "Masqué"}</span></div><div class="item-actions"><button data-edit="${item.id}">Modifier</button><button class="delete-button" data-delete="${item.id}">Supprimer</button></div></div></article>`;
  }

  function openEditor(record) {
    const info = panelInfo[state.panel];
    $("editorForm").reset();
    $("recordId").value = record?.id || "";
    $("currentImageUrl").value = record?.image_url || "";
    $("currentStoragePath").value = record?.storage_path || "";
    $("imageFields").hidden = !info.image;
    $("serviceFields").hidden = info.image;
    document.querySelectorAll(".seasonal-only").forEach(el => el.hidden = state.panel !== "seasonal");
    $("dialogEyebrow").textContent = record ? "MODIFIER" : "NOUVEL ÉLÉMENT";
    $("dialogTitle").textContent = record ? "Modifier l’élément" : `Ajouter · ${info.title}`;
    $("displayOrder").value = record?.display_order ?? state.records.length;
    $("isVisible").checked = record?.is_visible ?? true;
    if (info.image) {
      $("titleFr").value = record?.title_fr || ""; $("titleEn").value = record?.title_en || "";
      $("subtitleFr").value = record?.subtitle_fr || ""; $("subtitleEn").value = record?.subtitle_en || "";
      setPreview(displayImageUrl(record?.image_url));
    } else {
      $("nameFr").value = record?.name_fr || ""; $("nameEn").value = record?.name_en || "";
      $("priceFr").value = record?.price_fr || ""; $("priceEn").value = record?.price_en || "";
      $("serviceCategory").value = record?.category || "manucure";
    }
    $("editorDialog").showModal();
  }
  function closeEditor() { $("editorDialog").close(); }

  function previewFile() {
    const file = $("imageFile").files[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { showNotice("La photo dépasse 8 Mo.", true); $("imageFile").value = ""; return; }
    setPreview(URL.createObjectURL(file));
  }
  function setPreview(src) {
    $("imagePreview").hidden = !src; $("uploadPrompt").hidden = !!src;
    if (src) $("imagePreview").src = src; else $("imagePreview").removeAttribute("src");
  }

  async function saveRecord(event) {
    event.preventDefault();
    const info = panelInfo[state.panel];
    const id = $("recordId").value;
    setBusy($("saveButton"), true, "Enregistrement…");
    try {
      let payload;
      if (info.image) {
        if (!$("titleFr").value.trim() || (!id && !$("imageFile").files[0])) throw new Error("Ajoutez une photo et un nom français.");
        let imageUrl = $("currentImageUrl").value;
        let storagePath = $("currentStoragePath").value;
        const file = $("imageFile").files[0];
        if (file) {
          const extension = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
          storagePath = `${info.collection}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
          const upload = await db.storage.from(cfg.imageBucket).upload(storagePath, file, { contentType: file.type, upsert: false });
          if (upload.error) throw upload.error;
          imageUrl = db.storage.from(cfg.imageBucket).getPublicUrl(storagePath).data.publicUrl;
        }
        payload = { collection: info.collection, title_fr: $("titleFr").value.trim(), title_en: $("titleEn").value.trim(), subtitle_fr: $("subtitleFr").value.trim(), subtitle_en: $("subtitleEn").value.trim(), image_url: imageUrl, storage_path: storagePath, display_order: Number($("displayOrder").value) || 0, is_visible: $("isVisible").checked };
      } else {
        if (!$("nameFr").value.trim() || !$("priceFr").value.trim()) throw new Error("Ajoutez le nom et le prix en français.");
        payload = { name_fr: $("nameFr").value.trim(), name_en: $("nameEn").value.trim(), price_fr: $("priceFr").value.trim(), price_en: $("priceEn").value.trim(), category: $("serviceCategory").value, display_order: Number($("displayOrder").value) || 0, is_visible: $("isVisible").checked };
      }
      const result = id ? await db.from(info.table).update(payload).eq("id", id) : await db.from(info.table).insert(payload);
      if (result.error) throw result.error;
      closeEditor(); showNotice("Les modifications ont été enregistrées."); await loadRecords();
    } catch (error) { showNotice(error.message || "Impossible d’enregistrer.", true); }
    finally { setBusy($("saveButton"), false, "Enregistrer"); }
  }

  async function deleteRecord(record) {
    if (!record || !window.confirm("Supprimer définitivement cet élément?")) return;
    const info = panelInfo[state.panel];
    const result = await db.from(info.table).delete().eq("id", record.id);
    if (result.error) { showNotice(result.error.message, true); return; }
    if (info.image && record.storage_path) await db.storage.from(cfg.imageBucket).remove([record.storage_path]);
    showNotice("L’élément a été supprimé."); await loadRecords();
  }

  function showNotice(message, error = false) { const el = $("notice"); el.textContent = message; el.classList.toggle("error", error); el.hidden = false; window.setTimeout(() => { el.hidden = true; }, 5000); }
  function setBusy(button, busy, text) { button.disabled = busy; button.textContent = text; }
  function categoryLabel(value) { return ({manucure:"Manucures",extension:"Extensions",extra:"Extras",autre:"Autres services"})[value] || value; }
  function displayImageUrl(value) {
    const src = String(value || "").trim();
    if (!src || /^(?:[a-z][a-z0-9+.-]*:|\/\/|\/)/i.test(src)) return src;
    return isDashboardPage ? `../${src.replace(/^\.\//, "")}` : src;
  }
  function html(value) { const div = document.createElement("div"); div.textContent = value == null ? "" : String(value); return div.innerHTML; }
  function attr(value) { return html(value).replace(/`/g, "&#96;"); }
})();
