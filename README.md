# Zusammenzeug

Private Alltags-Web-App für Nina und Dominic. Erste Version: Startseite, Küche mit Rezeptverwaltung und eine aktuelle Einkaufsliste mit Archiv. Zwei warme Farbvarianten, responsive für Handy, Tablet und Desktop.

## Vercel

Repository importieren. Framework Preset **Other**, Root Directory **./**, Build Command **npm run build**, Output Directory **dist**. Keine Environment-Variablen oder Installationspakete erforderlich. `main` enthält die erste Version.

## Entwicklung

Node.js 22 oder neuer für Tests/Build. `npm run dev` startet einen lokalen Node.js-Server auf Port 5173. `npm test` prüft die Einkaufslogik, `npm run build` erzeugt dist.

## Daten und Grenzen

Kein Auth, kein Firebase-Zugriff. Daten liegen ausschließlich im localStorage des jeweiligen Browserprofils (`zusammenzeug.v1`). Geräte teilen keine Daten. Browserdaten löschen oder privates Surfen können Daten verlieren. Nicht für gemeinsam gleichzeitiges Bearbeiten in mehreren Tabs gedacht. Der spätere Firebase-Ausbau erhält eine kontrollierte Migration; er ist noch nicht implementiert.

Es existiert höchstens eine aktuelle Liste. Rezeptübernahme und manuelle Produkte ergänzen sie. Nur offene Einträge mit gleichem normalisiertem Namen, gleicher Einheit und bekannten Mengen werden addiert. Unterschiedliche Einheiten und unbekannte Mengen bleiben getrennt. Abgehakte Produkte werden durch neue Zutaten nicht verändert. Abschluss archiviert auch offene Einträge nach Bestätigung. Neue Listen entstehen erst bei Bedarf.

Rezepte: Name, Portionen, optionale Zeit/Kategorie, Zutaten mit optionalen Mengen und Zubereitung. Vor dem Übernehmen lassen sich Portionen ändern und Zutaten abwählen. Keine erfundenen Demo-Rezepte oder Nutzerdaten.
