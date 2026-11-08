# 🎅 Pakjesavond Live

Interactief Sinterklaas-dobbelspel voor de woonkamer, met **Het Grote Boek van Sinterklaas**.
Hybride architectuur: *Cloud Brievenbus* (Turso + Drizzle) vooraf, *Local GameEngine* (localStorage) tijdens het spel.

## Starten

```bash
npm install
cp .env.example .env.local   # optioneel: Turso-gegevens. Zonder dit gebruikt de app ./local.db (SQLite)
npm run dev                  # http://localhost:3000
npm test                     # engine-tests
```

Tabellen worden automatisch aangemaakt (`CREATE TABLE IF NOT EXISTS`); `npm run db:push` kan ook (drizzle-kit).

## Flow (MVP)

| Route | Doel |
|---|---|
| `/` | Nieuw spel, verder met lopend spel, **Demo-modus** (6 spelers) |
| `/host/spel` | Lobby (spelers op zitvolgorde, 🍼 jongste speler, sfeer, speelduur Ronde 2) en daarna de controller |
| `/tv/spel` | 10-foot TV-scherm (100vh, geen scrollbars), synchroniseert via `BroadcastChannel` + `storage` |

Alles draait 100% lokaal (localStorage); er zijn geen database-requests nodig. TV en controller moeten in dezelfde browser
(twee tabbladen/vensters op dezelfde laptop) draaien.

Twee spelmodi (kies in de lobby):
- **🏠 Woonkamer-Modus** (6-8 personen): 1-voor-1 beurten met host-telefoon en TV.
- **🏫 Klassikale Modus (30+)**: snellere dobbelaar en Schiet-op-Piet-klok (15s), geen lange pingpong-duels, een automatische **Klasse-Schuif** (iedereen geeft tegelijk een cadeau door) elke 4e beurt, een compacte tweeringige kring voor het digibord en extra grote pijlen. Namen kun je in bulk plakken; probeer de demo met 32 leerlingen op de startpagina.

Drie rondes, met per ronde een vaste betekenis per dobbelsteen-getal (zichtbaar in de **Dobbelsteen-Legenda** links op het TV-scherm; het gegooide getal licht op):
1. **Verdeelronde** (geen tijdslimiet): 6 vaste regels, tot de stapel leeg is.
2. **Uitpakronde** (geen tijdslimiet): rustige vaste regels; alleen gooi 4 is een Huiskamer-Opdracht.
3. **Geheime Stoomboot-Finale** (geheime timer): vaste categorie per getal, Kluis 🔒 / Mijter 🛡️, gooi 4 = Opdrachten-Deck, gooi 6 = Chaos van Piet (Chaos-Deck van 6 kaarten). Laatste 5 minuten: 20s Schiet-op-Piet, vals alarm, turbo en eindsignaal.

Het Opdrachten-Deck (`src/content/deck.ts`, 50 kaarten, Smart Deck zonder herhaling) heeft kaarten met een timer. Die start niet vanzelf: de host tikt "▶️ Start klok", waarna de TV "Klaar? 3... 2... 1... GO!" aftelt.

**Het Grote Boek staat uit** (`src/lib/features.ts` → `FEATURES.book = false`). Code, API-routes (`/api/rooms/**`),
pagina's `/nieuw` en `/join/[roomId]` en de Drizzle-tabellen (`rooms`, `submissions`) zijn intact; zet de vlag op `true` om alles terug te krijgen.

## Techniek

- `src/db/schema.ts` – Drizzle-schema (`rooms`, `submissions`). `rooms.hostPin` bevat een gesalte scrypt-hash.
- `src/app/api/rooms/**` – route handlers. Inzendingen zijn alleen met pin op te halen; `/join` ziet nooit andermans tekst.
- `src/game/engine.ts` – pure GameEngine (Smart Decks, zitkring, Kluis/Mijter, Grote Boek, geheime eindtijd, Schiet-op-Piet, vals alarm, turbo, einde).
- `src/game/store.ts` – localStorage-herstel (F5-proof), sync, Wake Lock. `src/game/sound.ts` – alle geluid live gesynthetiseerd.
- `src/content/*` – opdrachten, prikkelvragen, aanloopzinnen, stellingen en Grote Boek-fallbacks per doelgroep.

## De Pietenpakjes-race (klas-spel, `/race`)

Een apart spel voor de basisschool (groep 3-8), volledig offline in de browser (stand in `localStorage`, een refresh raakt niets kwijt).

- **Digitaal:** 4-6 teams, Pietenvraag met timer (30 sec, +15 sec) -> goede teams dobbelen -> troostpakje voor foute teams. Verborgen pakjeswaardes (1-5 pepernoten, Pietenpech 0, Gouden pakje 8), finale met trommelroffel, confetti en bijzondere prijzen.
- **Met echte pakjes:** de hele klas in een kring, de tv zegt wat iedereen doet (links, rechts, overbuur, Kleurenpiet, Pietenvraag, Sinterklaas). Altijd ruilen, nooit afpakken.
- **Bediening:** spatiebalk = volgende fase, `U` terugdraaien, `P` pauze, `+` 15 sec erbij, `N` andere vraag. Alles ook met grote knoppen.
- **Code:** engines in `src/race/digital.ts` en `src/race/real.ts` (pure state machines, geen UI), seedbare random in `src/race/common.ts` (`/race?seed=7` geeft hetzelfde spel), vragen in `src/race/questions/*.json` (type, tekst, antwoord, tijd).
