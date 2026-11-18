# Gardsbutikken – overlevering

Les denne fila før du endrar noko. Alt du treng for å halde fram, ligg i dette repoet.

## Status (18.11.2026)
- Prototype utan Vipps-avtale. Betaling er simulert («TESTMODUS»).
- Live: https://dskorge.github.io/Fredheim-butikk/ (stor F). Etikettar: `#etikettar`.
- Éi HTML-fil, ingen server. Byggjast med `python3 build.py` frå `src/` til `index.html`.

## Filer
| Fil | Innhald |
|---|---|
| `src/app.js` | All logikk: prisar, kodeformat, korg, skannar, kvittering, etikettar |
| `src/shell.html` | HTML og CSS. Plasshaldarar `__LOGO__`, `__QR__`, `__JSQR__`, `__APP__` |
| `src/qr.min.js` | qrcode-generator (MIT) – lagar QR på etikettane |
| `src/jsqr.min.js` | jsQR (Apache-2.0) – les QR frå kameraet |
| `build.py` | Set saman `index.html` |

Språk i butikken: nynorsk. Fargar og skrift frå Fredheim-profilen (Fraunces + Instrument Sans). Vipps-knapp `#FF5B24`.

## Prisar (avgjort i gardsbutikk-prosjektet)
| Vare | Pris |
|---|---|
| Kjøtdeig laus vekt | 219 kr/kg |
| Egg 12 stk | 65 kr |
| Egg brett 30 | 150 kr |
| Familiekasse ca. 10 kg | 2 890 kr |
| Halv kasse | 1 490 kr |
| Kjøtdeigpakke 5 kg | 1 090 kr |
| Helgepakke ca. 2 kg | 990 kr |
| Heilmjølk 1 l | 45 kr (49 kr er vurdert) |
| Glasflaske | 20 kr |

Ope: stykningsdelar enkeltvis (berre intervall avgjort, snitt 360 kr/kg).

## Flaskeordning (ikkje pant)
- Kunden kjøper flaska éin gong (20 kr). Deretter byter han tom flaske mot full.
- Ingen kontantar tilbake. Flaska er ei vanleg salsvare med 15 % mva, ført som inntekt.
- Ordet «pant» skal ikkje brukast mot kunden.
- Ved skanning av mjølk: dialog «Har du med tom flaske å byte?» → «Ja, eg byter flaske» (berre mjølk) eller «Nei, kjøp flaske (+ 20 kr)» (mjølk + linja «Glasflaske»).
- Tek kunden ut mjølk, går flaskelinjene ned tilsvarande.
- Innleverte flasker blir vaska og kontrollerte på garden før dei blir fylte på nytt. Kunden fyller aldri sjølv.

## Kodeformat
Pakke med vekt eller fast pris (unik per pakke):
```
F1.<pakke-id>.<produkt>.<gram>.<kr>.<pakkedato DDMMÅÅ>.<parti>.<sjekk>
F1.P1001.deig.512.112.181126.B2611.ws
```
Hyllevare (same kode på alle):
```
F1.H.<produkt>.<sjekk>
F1.H.mjolk.f
```
QR-en inneheld ein URL: `<butikk-adresse>#v=<kode>`. Vanleg mobilkamera opnar då butikken og legg vara i korga.

**Prototypen brukar ein enkel sjekksum som kven som helst kan rekne ut. Han er ikkje tryggleik.**

## Krav til den ekte versjonen (med Vipps)
1. **Serveren eig prisen.** QR-en skal berre innehalde ein tilfeldig pakke-ID (minst 64 bit) og ein HMAC-signatur. Vekt, pris og produkt blir slått opp i databasen.
2. **Serveren lagar Vipps-betalinga** (ePayment API) med beløpet frå databasen. Nettlesaren sender berre lista med pakke-ID-ar.
3. **Seld-status i databasen.** Ein pakke blir reservert når betalinga startar og merkt seld når Vipps stadfestar. Reservasjonen blir frigjord etter ca. 10 minutt.
4. **Stadfesting frå Vipps:** stol berre på webhook eller statusoppslag mot Vipps, aldri på at kunden kjem tilbake til sida.
5. **Nøklar:** Vipps-nøklar og HMAC-nøkkel ligg som hemmelegheiter på serveren. Aldri i dette repoet (det er offentleg).
6. **Ikkje opne garden sitt nett.** Betalings-backend køyrer i skyen (t.d. Cloudflare Workers eller tilsvarande). Huben hentar salsdata derifrå. Ingen port blir opna inn til Huben, Home Assistant, robot-PC eller kamera.
7. **Kvittering:** ordrelinjer til Vipps Order Management, med mva per linje.
8. **Personvern:** lagre ordre-ID, varer, beløp og tid. Ikkje telefonnummer eller namn med mindre det trengst.
9. **Etikettskrivar og vekt:** ei enkel side på Huben (berre lokalt nett) som registrerer pakken i databasen og skriv ut etiketten.

## Testplan (prototype)
Skriv ut `#etikettar` på A4 og test med fleire telefonar (iPhone og Android).

**Funksjon**
- [ ] Vanleg kamera-app opnar butikken og legg vara i korga
- [ ] Skannaren i sida les kodar på 20–40 cm avstand, også i dårleg lys
- [ ] Same pakke to gonger → «ligg alt i korga»
- [ ] Betalt pakke skanna på nytt → «alt seld»
- [ ] Endra kode → «Ukjend eller endra kode»
- [ ] Mjølk: begge val i dialogen, +/- på mjølk og flaske, flaskelinja følgjer mjølka ned
- [ ] Sum og mva stemmer (mva = sum × 15/115)
- [ ] Korga overlever at sida blir lukka og opna igjen
- [ ] «Nullstill testdata» tømer alt

**Visuelt**
- [ ] Etikett lesbar på armlengds avstand, QR minst 25 mm
- [ ] Utskrift på etikettskrivar (vakuumpose, kald og fuktig overflate)
- [ ] Botnlinja dekkjer ikkje innhald på liten skjerm
- [ ] Dørplakaten forstått av nokon som ikkje har sett løysinga før

## Arbeidsflyt
```
python3 build.py
git add -A && git commit -m "..." && git push
```
GitHub Pages publiserer automatisk frå `main` i løpet av eit minutt.
