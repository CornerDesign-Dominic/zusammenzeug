export const fresh = () => ({
  version: 1,
  recipes: [],
  active: null,
  archive: [],
});
export const uid = () =>
  globalThis.crypto.randomUUID?.() ||
  Array.from(globalThis.crypto.getRandomValues(new Uint8Array(16)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
export const normalize = (s) =>
  String(s).trim().replace(/\s+/g, " ").toLocaleLowerCase("de");
export function number(value) {
  if (String(value).trim() === "") return null;
  const n = Number(String(value).replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}
export function addItems(state, items) {
  const valid = items.filter((i) => i.name?.trim());
  if (!valid.length) return;
  state.active ??= {
    id: uid(),
    createdAt: new Date().toISOString(),
    items: [],
  };
  for (const input of valid) {
    const name = input.name.trim(),
      unit = (input.unit || "").trim(),
      quantity = number(input.quantity);
    const old = state.active.items.find(
      (i) =>
        !i.checked &&
        normalize(i.name) === normalize(name) &&
        normalize(i.unit) === normalize(unit) &&
        i.quantity !== null &&
        quantity !== null,
    );
    if (old)
      old.quantity = Math.round((old.quantity + quantity) * 10000) / 10000;
    else
      state.active.items.push({
        id: uid(),
        name,
        unit,
        quantity,
        checked: false,
      });
  }
}
export function complete(state) {
  if (!state.active) return;
  state.archive.unshift({
    ...state.active,
    completedAt: new Date().toISOString(),
  });
  state.active = null;
}
export function scaledIngredients(recipe, portions) {
  return recipe.ingredients.map((i) => ({
    ...i,
    quantity:
      i.quantity === null
        ? null
        : Math.round(((i.quantity * portions) / recipe.portions) * 10000) /
          10000,
  }));
}
export function validateState(s) {
  return (
    s?.version === 1 &&
    Array.isArray(s.recipes) &&
    Array.isArray(s.archive) &&
    (s.active === null || Array.isArray(s.active?.items))
  );
}
