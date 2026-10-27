// Standalone preparation tool. This file is deliberately excluded from dist/.
// An API key from the Firebase web config is NOT an administrative credential.
import { readFile } from "node:fs/promises";
const projectId = "zusammenzeugdb";
const databaseId = "(default)";
const collection = "recipes";
const recipes = JSON.parse(
  await readFile(
    new URL("../data/example-recipes.json", import.meta.url),
    "utf8",
  ),
);
const ids = new Set();
for (const r of recipes) {
  if (
    !/^example-[a-z0-9-]+$/.test(r.id) ||
    ids.has(r.id) ||
    !r.name ||
    !Number.isInteger(r.portions) ||
    r.portions < 1 ||
    !Number.isFinite(r.minutes) ||
    r.minutes < 1 ||
    !r.category ||
    r.isExample !== true ||
    !r.instructions ||
    !Array.isArray(r.ingredients) ||
    !r.ingredients.length
  )
    throw new Error("Ungültiges Beispielrezept.");
  ids.add(r.id);
  for (const i of r.ingredients)
    if (
      !i.name ||
      typeof i.unit !== "string" ||
      !(
        i.quantity === null ||
        (typeof i.quantity === "number" &&
          Number.isFinite(i.quantity) &&
          i.quantity > 0)
      )
    )
      throw new Error(`Ungültige Zutat in ${r.id}.`);
}
if (recipes.length !== 5)
  throw new Error("Genau fünf Beispielrezepte erwartet.");
console.log(
  `Vorbereitet: ${recipes.length} Rezepte für ${projectId}/${databaseId}/${collection}.`,
);
for (const r of recipes) console.log(`- ${r.name} (${r.portions} Portionen)`);
const args = process.argv.slice(2);
if (args.some((a) => a !== "--apply"))
  throw new Error("Unbekannte Option. Erlaubt ist nur --apply.");
if (!args.includes("--apply")) {
  console.log(
    "Nur geprüft. Keine Datenbankverbindung und keine Schreibzugriffe.",
  );
  process.exit(0);
}
const token = process.env.GOOGLE_OAUTH_ACCESS_TOKEN;
if (!token)
  throw new Error(
    "GOOGLE_OAUTH_ACCESS_TOKEN mit Firestore-Schreibberechtigung fehlt. Keine Daten geschrieben.",
  );
const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}`;
const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};
function value(v) {
  if (v === null) return { nullValue: null };
  if (typeof v === "string") return { stringValue: v };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number")
    return Number.isInteger(v)
      ? { integerValue: String(v) }
      : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(value) } };
  return {
    mapValue: {
      fields: Object.fromEntries(
        Object.entries(v).map(([k, v]) => [k, value(v)]),
      ),
    },
  };
}
const pending = [];
for (const recipe of recipes) {
  const res = await fetch(`${base}/documents/${collection}/${recipe.id}`, {
    headers,
    signal: AbortSignal.timeout(20000),
  });
  if (res.ok) {
    console.log(`Bereits vorhanden, unverändert: ${recipe.id}`);
    continue;
  }
  if (res.status !== 404)
    throw new Error(
      `Firestore-Zugriff fehlgeschlagen (HTTP ${res.status}). Keine Daten geschrieben.`,
    );
  const body = await res.json();
  // A missing database also returns 404; do not mistake that for a missing recipe.
  if (
    /database.*(not exist|not found)|not exist.*database/i.test(
      body.error?.message || "",
    )
  )
    throw new Error(
      "Firestore-Datenbank fehlt. Bitte zuerst in Firebase anlegen.",
    );
  const name = `projects/${projectId}/databases/${databaseId}/documents/${collection}/${recipe.id}`;
  pending.push({
    update: { name, fields: value(recipe).mapValue.fields },
    currentDocument: { exists: false },
  });
}
if (!pending.length) {
  console.log("Alle fünf Beispielrezepte sind bereits vorhanden.");
  process.exit(0);
}
const committed = await fetch(`${base}/documents:commit`, {
  method: "POST",
  headers,
  body: JSON.stringify({ writes: pending }),
  signal: AbortSignal.timeout(20000),
});
if (!committed.ok)
  throw new Error(
    `Import fehlgeschlagen (HTTP ${committed.status}). Bei unklarem Netzwerkstatus erneut ausführen; vorhandene IDs werden übersprungen.`,
  );
for (const write of pending) {
  const res = await fetch(
    `https://firestore.googleapis.com/v1/${write.update.name}`,
    { headers, signal: AbortSignal.timeout(20000) },
  );
  if (!res.ok)
    throw new Error(
      "Importantwort erfolgreich, anschließende Leseprüfung fehlgeschlagen. Datenbankstatus bitte prüfen.",
    );
  const doc = await res.json();
  if (JSON.stringify(doc.fields) !== JSON.stringify(write.update.fields)) {
    // Object key ordering differs in Firestore responses; compare recursively.
    const canonical = (v) =>
      Array.isArray(v)
        ? v.map(canonical)
        : v && typeof v === "object"
          ? Object.fromEntries(
              Object.keys(v)
                .sort()
                .map((k) => [k, canonical(v[k])]),
            )
          : v;
    if (
      JSON.stringify(canonical(doc.fields)) !==
      JSON.stringify(canonical(write.update.fields))
    )
      throw new Error("Leseprüfung: Unerwarteter Rezeptinhalt.");
  }
}
console.log(
  `${pending.length} neue Rezepte geschrieben und durch erneutes Lesen geprüft.`,
);
