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

## Flow

| Route | Doel |
|---|---|
| `/` | Start, host-toegang, **Demo-modus** (6 spelers + 10 inzendingen, volledig lokaal) |
| `/nieuw` | Kamer + hostPin + spelers aanmaken, deelbare `/join/[roomId]`-link |
| `/join/[roomId]` | 3-staps invul-flow (vraag → aanloopzin → live TV-preview) of kant-en-klare stelling |
| `/host/[roomId]` | Pin → **één** API-call haalt kamer + inzendingen naar localStorage. Lobby, zitkring, controller |
| `/tv/[roomId]` | 10-foot TV-scherm (100vh, geen scrollbars), synchroniseert via `BroadcastChannel` + `storage` |

Tijdens het spel zijn er **geen** database-requests meer. TV en controller moeten in dezelfde browser
(twee tabbladen/vensters op dezelfde laptop) draaien. Een losse telefoon als afstandsbediening
vereist een echte P2P/WebRTC-koppeling en zit er niet in.

## Techniek

- `src/db/schema.ts` – Drizzle-schema (`rooms`, `submissions`). `rooms.hostPin` bevat een gesalte scrypt-hash.
- `src/app/api/rooms/**` – route handlers. Inzendingen zijn alleen met pin op te halen; `/join` ziet nooit andermans tekst.
- `src/game/engine.ts` – pure GameEngine (Smart Decks, zitkring, Kluis/Mijter, Grote Boek, geheime eindtijd, Schiet-op-Piet, vals alarm, turbo, einde).
- `src/game/store.ts` – localStorage-herstel (F5-proof), sync, Wake Lock. `src/game/sound.ts` – alle geluid live gesynthetiseerd.
- `src/content/*` – opdrachten, prikkelvragen, aanloopzinnen, stellingen en Grote Boek-fallbacks per doelgroep.
