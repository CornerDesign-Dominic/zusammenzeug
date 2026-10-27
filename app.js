import {
  fresh,
  uid,
  number,
  addItems,
  complete,
  scaledIngredients,
  validateState,
} from "./core.js";
const KEY = "zusammenzeug.v1",
  THEME = "zusammenzeug.theme";
const paths = {
  home: '<path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/>',
  recipes:
    '<path d="M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-2H4Z"/><path d="M20 4h-4a3 3 0 0 0-3 3v14a4 4 0 0 1 4-2h3Z"/>',
  shopping:
    '<path d="m3 7 2 13h14l2-13Z"/><path d="m8 8 4-6 4 6M9 12v4m6-4v4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',
  moon: '<path d="M20 14A9 9 0 0 1 10 3a9 9 0 1 0 10 11Z"/>',
  search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>',
  pot: '<path d="M5 10h14v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4ZM3 10h18M2 13h3m14 0h3M9 6c-3-3 3-2 0-5m6 5c-3-3 3-2 0-5"/>',
  trash: '<path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  archive: '<path d="M4 8h16v13H4ZM3 3h18v5H3Zm7 9h4"/>',
};
const icon = (n) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[n] || paths.pot}</svg>`;
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const fmt = (n) =>
  n === null
    ? ""
    : new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 }).format(n);
const qty = (i) => [fmt(i.quantity), i.unit].filter(Boolean).join(" ");
const date = (s) =>
  new Date(s).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
let storageIssue = "",
  state = fresh(),
  readOnly = false;
try {
  const raw = localStorage.getItem(KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    if (!validateState(parsed)) throw Error();
    state = parsed;
  }
} catch {
  storageIssue =
    "Gespeicherte Daten konnten nicht gelesen werden. Sie werden nicht überschrieben. Bitte exportiere zuerst die Sicherung.";
  readOnly = true;
}
let lastSaved = JSON.stringify(state);
const main = document.querySelector("#main"),
  modal = document.querySelector("#modal");
function save() {
  if (readOnly) {
    state = JSON.parse(lastSaved);
    toast("Speichern gesperrt: Bitte zuerst die Sicherung exportieren.");
    return false;
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    lastSaved = JSON.stringify(state);
    return true;
  } catch {
    storageIssue =
      "Speichern fehlgeschlagen. Die Änderung wurde nicht übernommen. Bitte prüfe den verfügbaren Browserspeicher.";
    state = JSON.parse(lastSaved);
    render();
    toast("Die Änderung konnte nicht dauerhaft gespeichert werden.");
    return false;
  }
}
function toast(msg) {
  const t = document.querySelector("#toast");
  t.textContent = msg;
  t.style.display = "block";
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (t.style.display = "none"), 4500);
}
function theme() {
  let dark = false;
  try {
    dark = localStorage.getItem(THEME) === "dark";
  } catch {}
  document.body.classList.toggle("dark", dark);
  themeButton();
}
function themeButton() {
  const dark = document.body.classList.contains("dark");
  const b = document.querySelector("#theme");
  b.innerHTML =
    icon(dark ? "sun" : "moon") +
    `<span>${dark ? "Gemütlich hell" : "Gemütlich dunkel"}</span>`;
  b.setAttribute(
    "aria-label",
    `Zu ${dark ? "hellem" : "dunklem"} Design wechseln`,
  );
  document.querySelector("meta[name=theme-color]").content = dark
    ? "#1e2723"
    : "#f7f5ef";
}
document.querySelector("#theme").onclick = () => {
  document.body.classList.toggle("dark");
  try {
    localStorage.setItem(
      THEME,
      document.body.classList.contains("dark") ? "dark" : "light",
    );
  } catch {}
  themeButton();
};
theme();
function route() {
  const r = location.hash.slice(1);
  return ["home", "recipes", "shopping", "archive"].includes(r) ? r : "home";
}
function openModal(title, body) {
  modal.innerHTML = `<div class="modal-head"><h2 id="modal-title">${esc(title)}</h2><button type="button" class="icon-btn" data-action="close" aria-label="Fenster schließen">${icon("close")}</button></div>${body}`;
  if (!modal.open) modal.showModal();
}
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    const b = modal.getBoundingClientRect();
    if (
      e.clientX < b.left ||
      e.clientX > b.right ||
      e.clientY < b.top ||
      e.clientY > b.bottom
    )
      modal.close();
  }
});
function render() {
  const r = route();
  for (const a of document.querySelectorAll("[data-nav]")) {
    const n = a.dataset.nav;
    a.innerHTML =
      icon(n) +
      `<span>${{ home: "Zuhause", recipes: "Küche", shopping: "Einkauf" }[n]}</span>`;
    a.classList.toggle(
      "active",
      n === r || (r === "archive" && n === "shopping"),
    );
    if (a.classList.contains("active")) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  }
  const count = state.active?.items.filter((i) => !i.checked).length || 0;
  main.innerHTML = `<div class="topline"><span>Unser Alltag, zusammen.</span><span class="avatar" aria-hidden="true">♡</span></div>${storageIssue ? `<div class="storage-error">${esc(storageIssue)} <button class="btn secondary" data-action="export">Sicherung exportieren</button></div>` : ""}`;
  if (r === "home")
    main.innerHTML += `<span class="eyebrow">SCHÖN, DASS DU DA BIST</span><h1>Hier sind wir zuhause.</h1><p class="sub">Ein bisschen planen. Ein bisschen sammeln. Viel zusammen.</p><section class="hero"><div><span class="eyebrow">UNSERE KÜCHE</span><h2>Was kochen<br>wir heute?</h2><p>Lieblingsgerichte sammeln und den nächsten Einkauf ganz nebenbei planen.</p><a class="btn" href="#recipes">Zur Rezeptsammlung ${icon("arrow")}</a></div><div class="hero-art" aria-hidden="true"><div class="plate">${icon("pot")}</div><span class="herb">❧</span><span class="art-caption">Mit Liebe & einer Prise Salz.</span></div></section><div class="section-head"><h2>Unser kleiner Überblick</h2><span class="eyebrow">ALLES AN SEINEM PLATZ</span></div><div class="grid"><a class="panel feature" href="#shopping"><div class="icon-box">${icon("shopping")}</div><div><h3>Unser Einkauf</h3><p>${state.active ? `${count} ${count === 1 ? "Produkt noch offen" : "Produkte noch offen"}` : "Bereit für die nächste Einkaufsliste"}</p></div><span class="arrow">↗</span></a><a class="panel feature" href="#recipes"><div class="icon-box" style="background:var(--peach)">${icon("recipes")}</div><div><h3>Unsere Rezepte</h3><p>${state.recipes.length ? `${state.recipes.length} ${state.recipes.length === 1 ? "Lieblingsgericht" : "Lieblingsgerichte"} gesammelt` : "Platz für eure Lieblingsgerichte"}</p></div><span class="arrow">↗</span></a></div><p class="quote">„Die besten Dinge teilen wir.“<small>UNSER ZUSAMMENZEUG</small></p>`;
  if (r === "recipes") {
    main.innerHTML += `<div class="page-head"><div><span class="eyebrow">UNSERE KÜCHE</span><h1>Lieblingsrezepte.</h1></div><button class="btn" data-action="new-recipe">${icon("plus")} Rezept</button></div><p class="sub">Für jeden Tag. Für besondere Abende. Für uns.</p><div class="tabs"><a class="active" href="#recipes">Rezepte <span class="muted">${state.recipes.length}</span></a><a href="#shopping">Einkaufsliste</a></div>${state.recipes.length ? `<div class="search">${icon("search")}<input id="search" aria-label="Rezepte suchen" placeholder="Ein Lieblingsgericht finden …"></div><div class="recipe-grid" id="recipe-grid"></div>` : empty("recipes", "Hier beginnt unsere Rezeptsammlung.", "Haltet euer erstes Lieblingsgericht fest. Die Zutaten landen später mit wenigen Tipps auf der Einkaufsliste.", "Erstes Rezept anlegen", "new-recipe")}`;
    if (state.recipes.length) recipeCards("");
  }
  if (r === "shopping") {
    main.innerHTML += `<span class="eyebrow">FÜR KÜCHE & ALLTAG</span><h1>Unser Einkauf.</h1><p class="sub">Ein gemeinsamer Platz für alles, was noch fehlt.</p>${shoppingTabs(false)}${state.active ? shoppingBody() : empty("shopping", "Was brauchen wir noch?", "Erstelle eine Einkaufsliste oder übernimm Zutaten aus einem Rezept. Alles kommt in dieselbe aktuelle Liste.", "Einkaufsliste starten", "new-list")}`;
  }
  if (r === "archive") {
    main.innerHTML += `<span class="eyebrow">SCHON ERLEDIGT</span><h1>Unser Einkaufsarchiv.</h1><p class="sub">Abgeschlossene Einkäufe, zum Nachschauen aufgehoben.</p>${shoppingTabs(true)}${state.archive.length ? state.archive.map((l) => `<button class="panel archive-card" style="width:100%;text-align:left;color:var(--ink)" data-action="show-archive" data-id="${l.id}"><div><h3>Einkauf vom ${date(l.completedAt)}</h3><p>${l.items.length} ${l.items.length === 1 ? "Produkt" : "Produkte"} · ${l.items.filter((i) => i.checked).length} abgehakt</p></div>${icon("arrow")}</button>`).join("") : empty("archive", "Noch alles frisch.", "Sobald ihr einen Einkauf abschließt, findet ihr die Liste hier wieder.", "", "")}`;
  }
}
function empty(i, title, text, button, action) {
  return `<div class="panel empty"><div class="icon-box">${icon(i)}</div><h2>${title}</h2><p>${text}</p>${button ? `<button class="btn" data-action="${action}">${icon("plus")}${button}</button>` : ""}</div>`;
}
function shoppingTabs(archive) {
  return `<div class="tabs"><a class="${archive ? "" : "active"}" href="#shopping">Aktuelle Liste</a><a class="${archive ? "active" : ""}" href="#archive">Archiv <span class="muted">${state.archive.length}</span></a></div>`;
}
function shoppingBody() {
  const list = state.active,
    checked = list.items.filter((i) => i.checked).length;
  return `<section class="panel"><div class="section-head" style="margin-top:0"><h2>Unsere Einkaufsliste</h2><span class="muted">${checked} / ${list.items.length} erledigt</span></div><form id="add-product" class="inline-form"><input name="name" aria-label="Produkt" placeholder="Was fehlt noch?" maxlength="120" required><input name="quantity" aria-label="Menge" placeholder="Menge" inputmode="decimal"><input name="unit" aria-label="Einheit" placeholder="Einheit" maxlength="20"><button class="btn" aria-label="Produkt hinzufügen">${icon("plus")} Hinzufügen</button></form><div id="items">${list.items.length ? list.items.map((i) => `<div class="shopping-item ${i.checked ? "checked" : ""}"><input type="checkbox" id="item-${i.id}" data-item="${i.id}" ${i.checked ? "checked" : ""}><label for="item-${i.id}">${esc(i.name)}<span class="quantity">${esc(qty(i))}</span></label><button class="icon-btn" aria-label="${esc(i.name)} entfernen" data-action="remove-item" data-id="${i.id}">${icon("close")}</button></div>`).join("") : '<p class="muted">Noch leer – ergänze Produkte oder Zutaten aus einem Rezept.</p>'}</div><div class="progress"><span style="width:${list.items.length ? (checked / list.items.length) * 100 : 0}%"></span></div><div class="footer-actions"><span class="muted">Gestartet am ${date(list.createdAt)}</span><button class="btn" data-action="complete">${icon("check")} Einkauf abschließen</button></div></section>`;
}
function recipeCards(query) {
  const found = state.recipes.filter((r) =>
    `${r.name} ${r.category} ${r.ingredients.map((i) => i.name).join(" ")}`
      .toLocaleLowerCase("de")
      .includes(query.toLocaleLowerCase("de")),
  );
  document.querySelector("#recipe-grid").innerHTML = found.length
    ? found
        .map(
          (r) =>
            `<button class="recipe-card" data-action="view-recipe" data-id="${r.id}"><div class="recipe-cover">${icon("pot")}</div><div class="recipe-content"><span class="tag">${esc(r.category || "Lieblingsgericht")}</span><h3>${esc(r.name)}</h3><small>${r.portions} Portionen${r.minutes ? " · " + r.minutes + " Min." : ""}</small></div></button>`,
        )
        .join("")
    : '<p class="muted">Kein passendes Rezept gefunden.</p>';
}
function ingredientRow(i = { name: "", quantity: null, unit: "" }) {
  return `<div class="ingredient-row"><input aria-label="Zutat" data-field="name" placeholder="Zutat" value="${esc(i.name)}" maxlength="120"><input aria-label="Menge" data-field="quantity" placeholder="Menge" inputmode="decimal" value="${esc(i.quantity ?? "")}"><input aria-label="Einheit" data-field="unit" placeholder="g, ml …" maxlength="20" value="${esc(i.unit)}"><button class="icon-btn" type="button" data-action="remove-ingredient" aria-label="Zutat entfernen">${icon("close")}</button></div>`;
}
function recipeForm(id) {
  const r = state.recipes.find((r) => r.id === id);
  openModal(
    r ? "Rezept bearbeiten" : "Ein neues Lieblingsrezept",
    `<form id="recipe-form" data-id="${r?.id || ""}"><label class="field">Name<input name="name" maxlength="120" required value="${esc(r?.name)}" placeholder="Zum Beispiel: Ninas Ofengemüse"></label><div class="form-row"><label class="field">Portionen<input name="portions" type="number" min="1" max="100" required value="${r?.portions || 2}"></label><label class="field">Zeit in Minuten · optional<input name="minutes" type="number" min="1" max="10000" value="${r?.minutes || ""}" placeholder="30"></label></div><label class="field">Kategorie · optional<input name="category" value="${esc(r?.category)}" maxlength="50" placeholder="Zum Beispiel: Abendessen"></label><div class="detail-section"><strong>Zutaten</strong><p class="muted">Menge und Einheit sind optional. Beispiel: Mehl · 200 · g</p><div id="ingredient-rows">${(r?.ingredients || [{}, {}]).map((i) => ingredientRow(i)).join("")}</div><button class="btn ghost" type="button" data-action="add-ingredient">${icon("plus")} Weitere Zutat</button></div><label class="field">Zubereitung<textarea name="instructions" rows="5" maxlength="20000" placeholder="So wird’s gemacht …">${esc(r?.instructions)}</textarea></label><p class="error" id="form-error" role="alert"></p><div class="modal-foot"><button type="button" class="btn secondary" data-action="close">Abbrechen</button><button class="btn">Rezept speichern</button></div></form>`,
  );
}
function viewRecipe(id) {
  const r = state.recipes.find((r) => r.id === id);
  if (!r) return;
  openModal(
    r.name,
    `<span class="tag">${esc(r.category || "Lieblingsgericht")}</span><p class="muted">${r.portions} Portionen${r.minutes ? " · " + r.minutes + " Minuten" : ""}</p><h3 class="detail-section">Zutaten</h3>${r.ingredients.map((i) => `<div class="shopping-item"><span>${esc(i.name)}</span><span class="muted" style="margin-left:auto">${esc(qty(i))}</span></div>`).join("")}<h3 class="detail-section">Zubereitung</h3><div class="recipe-detail">${esc(r.instructions || "Noch keine Zubereitung hinterlegt.")}</div><div class="modal-foot"><button class="icon-btn" data-action="delete-recipe" data-id="${r.id}" aria-label="Rezept löschen">${icon("trash")}</button><button class="btn secondary" data-action="edit-recipe" data-id="${r.id}">Bearbeiten</button><button class="btn" data-action="choose-ingredients" data-id="${r.id}" ${r.ingredients.length ? "" : "disabled"}>${icon("shopping")} In Einkaufsliste</button></div>`,
  );
}
function chooseIngredients(id) {
  const r = state.recipes.find((r) => r.id === id);
  openModal(
    "Was brauchen wir dafür?",
    `<form id="transfer-form" data-id="${id}"><p class="muted">${esc(r.name)} · Vorhandene Zutaten einfach abwählen.</p><label class="field">Gewünschte Portionen<input id="transfer-portions" name="portions" type="number" min="1" max="100" value="${r.portions}" required></label><div id="transfer-items">${scaledIngredients(
      r,
      r.portions,
    )
      .map(
        (i, index) =>
          `<label class="ingredient-choice"><input type="checkbox" name="ingredient" value="${index}" checked><span>${esc(i.name)}</span><small data-scaled="${index}">${esc(qty(i))}</small></label>`,
      )
      .join(
        "",
      )}</div><p class="notice">${state.active ? "Die Zutaten ergänzen eure aktuelle Einkaufsliste." : "Dabei wird eure neue aktuelle Einkaufsliste erstellt."}</p><p id="transfer-error" class="error" role="alert"></p><div class="modal-foot"><button class="btn secondary" type="button" data-action="view-recipe" data-id="${id}">Zurück</button><button class="btn">${icon("plus")} Zutaten übernehmen</button></div></form>`,
  );
}
function confirmComplete() {
  const list = state.active;
  if (!list) return;
  const open = list.items.filter((i) => !i.checked).length;
  openModal(
    "Einkauf abschließen?",
    `<p>${open ? `Es sind noch <strong>${open} Produkte offen</strong>. Du kannst die Liste trotzdem abschließen.` : "Alles besorgt? Dann ist dieser Einkauf erledigt."}</p><p class="muted">Die gesamte Liste wandert ins Archiv. Beim nächsten Hinzufügen entsteht eine neue Liste.</p><div class="modal-foot"><button class="btn secondary" data-action="close">Weiter einkaufen</button><button class="btn" data-action="confirm-complete">${icon("archive")} Abschließen & archivieren</button></div>`,
  );
}
function exportData() {
  const blob = new Blob(
    [
      readOnly
        ? localStorage.getItem(KEY) || ""
        : JSON.stringify(state, null, 2),
    ],
    { type: "application/json" },
  );
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "zusammenzeug-sicherung.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-action]");
  if (!b) return;
  const id = b.dataset.id;
  switch (b.dataset.action) {
    case "close":
      modal.close();
      break;
    case "new-recipe":
      recipeForm();
      break;
    case "edit-recipe":
      recipeForm(id);
      break;
    case "view-recipe":
      viewRecipe(id);
      break;
    case "choose-ingredients":
      chooseIngredients(id);
      break;
    case "add-ingredient":
      document
        .querySelector("#ingredient-rows")
        .insertAdjacentHTML("beforeend", ingredientRow());
      break;
    case "remove-ingredient":
      b.closest(".ingredient-row").remove();
      break;
    case "new-list":
      state.active ??= {
        id: uid(),
        createdAt: new Date().toISOString(),
        items: [],
      };
      if (!save()) return;
      render();
      document.querySelector("[name=name]")?.focus();
      break;
    case "remove-item":
      state.active.items = state.active.items.filter((i) => i.id !== id);
      if (!save()) return;
      render();
      break;
    case "complete":
      confirmComplete();
      break;
    case "confirm-complete":
      complete(state);
      if (!save()) return;
      modal.close();
      render();
      toast("Einkauf abgeschlossen und archiviert.");
      break;
    case "show-archive": {
      const l = state.archive.find((l) => l.id === id);
      openModal(
        "Einkauf vom " + date(l.completedAt),
        `<p class="muted">Abgeschlossen · ${l.items.length} ${l.items.length === 1 ? "Produkt" : "Produkte"}</p>${l.items.map((i) => `<div class="shopping-item"><span>${i.checked ? "✓" : "○"}</span><span>${esc(i.name)}</span><span class="muted" style="margin-left:auto">${esc(qty(i))}</span></div>`).join("")}<div class="modal-foot"><button class="btn" data-action="close">Schließen</button></div>`,
      );
      break;
    }
    case "delete-recipe":
      openModal(
        "Rezept löschen?",
        `<p>Dieses Rezept wird dauerhaft aus der Sammlung entfernt. Zutaten in Einkaufslisten bleiben erhalten.</p><div class="modal-foot"><button class="btn secondary" data-action="view-recipe" data-id="${id}">Behalten</button><button class="btn danger" data-action="confirm-delete" data-id="${id}">Rezept löschen</button></div>`,
      );
      break;
    case "confirm-delete":
      state.recipes = state.recipes.filter((r) => r.id !== id);
      if (!save()) return;
      modal.close();
      render();
      toast("Rezept gelöscht.");
      break;
    case "export":
      exportData();
      break;
  }
});
document.addEventListener("change", (e) => {
  if (e.target.matches("[data-item]")) {
    const i = state.active?.items.find((i) => i.id === e.target.dataset.item);
    if (i) {
      i.checked = e.target.checked;
      if (!save()) return;
      render();
      document.getElementById("item-" + i.id)?.focus();
    }
  }
});
document.addEventListener("input", (e) => {
  if (e.target.id === "search") recipeCards(e.target.value);
  if (e.target.id === "transfer-portions") {
    const r = state.recipes.find(
        (r) => r.id === e.target.closest("form").dataset.id,
      ),
      p = Number(e.target.value);
    if (p > 0 && p <= 100)
      scaledIngredients(r, p).forEach(
        (i, index) =>
          (document.querySelector(`[data-scaled="${index}"]`).textContent =
            qty(i)),
      );
  }
});
document.addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target,
    data = new FormData(form);
  if (form.id === "add-product") {
    const quantity = data.get("quantity");
    if (String(quantity).trim() && number(quantity) === null) {
      toast("Bitte eine positive Menge eingeben, zum Beispiel 1,5.");
      return;
    }
    addItems(state, [
      { name: data.get("name"), quantity, unit: data.get("unit") },
    ]);
    if (!save()) return;
    render();
    document.querySelector("#add-product [name=name]")?.focus();
  }
  if (form.id === "recipe-form") {
    const ingredients = [];
    let invalid = false;
    for (const row of form.querySelectorAll(".ingredient-row")) {
      const name = row.querySelector("[data-field=name]").value.trim(),
        q = row.querySelector("[data-field=quantity]").value.trim(),
        unit = row.querySelector("[data-field=unit]").value.trim();
      if (!name && (q || unit)) invalid = true;
      if (name) {
        if (q && number(q) === null) invalid = true;
        ingredients.push({ name, quantity: number(q), unit });
      }
    }
    if (invalid || !data.get("name").trim()) {
      document.querySelector("#form-error").textContent =
        "Bitte Zutaten benennen und Mengen als positive Zahlen eingeben.";
      return;
    }
    const r = {
      id: form.dataset.id || uid(),
      name: data.get("name").trim(),
      portions: Number(data.get("portions")),
      minutes: data.get("minutes") ? Number(data.get("minutes")) : null,
      category: data.get("category").trim(),
      ingredients,
      instructions: data.get("instructions").trim(),
    };
    const index = state.recipes.findIndex((x) => x.id === r.id);
    if (index >= 0) state.recipes[index] = r;
    else state.recipes.unshift(r);
    if (!save()) return;
    modal.close();
    render();
    toast("Lieblingsrezept gespeichert.");
  }
  if (form.id === "transfer-form") {
    const recipe = state.recipes.find((r) => r.id === form.dataset.id),
      selected = data.getAll("ingredient").map(Number);
    if (!selected.length) {
      document.querySelector("#transfer-error").textContent =
        "Wähle mindestens eine Zutat aus.";
      return;
    }
    const items = scaledIngredients(
      recipe,
      Number(data.get("portions")),
    ).filter((_, i) => selected.includes(i));
    addItems(state, items);
    if (!save()) return;
    modal.close();
    render();
    toast("Zutaten zur aktuellen Einkaufsliste hinzugefügt.");
  }
});
window.addEventListener("hashchange", () => {
  modal.close();
  render();
  window.scrollTo(0, 0);
});
window.addEventListener("storage", (e) => {
  if (e.key === KEY && !modal.open) {
    try {
      const next = JSON.parse(e.newValue);
      if (validateState(next)) {
        state = next;
        lastSaved = JSON.stringify(state);
        render();
      }
    } catch {}
  }
});
render();
