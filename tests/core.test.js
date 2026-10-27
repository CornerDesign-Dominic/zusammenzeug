import { test } from "node:test";
import assert from "node:assert/strict";
import {
  fresh,
  addItems,
  complete,
  scaledIngredients,
  number,
} from "../core.js";
test("Erstes Hinzufügen erstellt genau eine Liste; weitere Zutaten nutzen dieselbe", () => {
  const s = fresh();
  addItems(s, [{ name: "Mehl", quantity: 200, unit: "g" }]);
  const id = s.active.id;
  addItems(s, [
    { name: " mehl ", quantity: "0,5", unit: " G " },
    { name: "Mehl", quantity: 1, unit: "kg" },
  ]);
  assert.equal(s.active.id, id);
  assert.equal(s.active.items[0].quantity, 200.5);
  assert.equal(s.active.items.length, 2);
});
test("Manuell angelegte Liste bleibt Ziel; abgehakte Produkte werden nicht verändert", () => {
  const s = fresh();
  s.active = { id: "manual", items: [] };
  addItems(s, [{ name: "Milch", quantity: 1, unit: "l" }]);
  s.active.items[0].checked = true;
  addItems(s, [{ name: "Milch", quantity: 2, unit: "l" }]);
  assert.equal(s.active.id, "manual");
  assert.equal(s.active.items.length, 2);
  assert.equal(s.active.items[0].quantity, 1);
});
test("Archivieren bewahrt die ganze Liste und erzeugt erst beim Hinzufügen eine neue", () => {
  const s = fresh();
  addItems(s, [{ name: "Salz" }]);
  const id = s.active.id;
  complete(s);
  assert.equal(s.active, null);
  assert.equal(s.archive[0].id, id);
  assert.equal(s.archive[0].items[0].checked, false);
  addItems(s, [{ name: "Brot" }]);
  assert.notEqual(s.active.id, id);
  assert.equal(s.archive[0].items.length, 1);
});
test("Portionen skalieren Mengen ohne das Rezept zu verändern", () => {
  const r = {
    portions: 2,
    ingredients: [
      { name: "Reis", quantity: 150, unit: "g" },
      { name: "Salz", quantity: null, unit: "" },
    ],
  };
  assert.equal(scaledIngredients(r, 3)[0].quantity, 225);
  assert.equal(scaledIngredients(r, 3)[1].quantity, null);
  assert.equal(r.ingredients[0].quantity, 150);
});
test("Unbekannte Mengen werden nicht zusammengezählt; ungültige Mengen erkannt", () => {
  const s = fresh();
  addItems(s, [{ name: "Salz" }, { name: "Salz" }]);
  assert.equal(s.active.items.length, 2);
  assert.equal(number("1,5"), 1.5);
  for (const v of ["", "abc", "-1", "0", "Infinity"])
    assert.equal(number(v), null);
});
