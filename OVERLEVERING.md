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
| `etikettar/` | Etikettmalar, etikettstasjon (vekt → A4-ark i blekkskrivar eller ZPL), eggplakat og testar. Sjå `etikettar/README.md` |

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
| Heilmelk 1 l | 45 kr (49 kr er vurdert) |
| Glasflaske | 20 kr |

Ope: stykningsdelar enkeltvis (berre intervall avgjort, snitt 360 kr/kg). Stykningsdelane ligg i `PROD` med `kg: null`:
kiloprisen blir sett på etikettstasjonen, og prisen står i koden. Nye varer må leggjast både i `PROD` og i `etikettar/produkt.js`.

## Tal på varer i korga (18.11.2026)
- Alle linjer har − og +. − på siste eksemplar fjernar linja.
- Fastpris med pakkekode (kjøtkasser): + aukar talet. Same kode skanna to gonger gir òg ein til.
- Vektvarer (kjøtdeig, stykningsdelar): kvar pakke har eiga vekt, pris og kode og ligg som eiga linje.
  + opnar kameraet («Skann neste pakke»). Same pakke skanna to gonger blir avvist med forklaring.
- Hyllevarer (egg, mjølk): + aukar talet. Mjølk går gjennom flaskedialogen.

## Egg (18.11.2026)
Egga står på brett utan lokk og har ingen etikett. Ein plakat over eggene (`etikettar/eggplakat.html`, A4 eller A3)
har éin QR-kode per vare (hyllekode `F1.H.egg30`, `F1.H.egg12`). Prisane på plakaten kjem frå `etikettar/produkt.js`;
`node etikettar/test/sjekk.js` kontrollerer at dei er like `PROD`.

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

## Varelager (plan, ikkje bygd)
Lager og etikettar er same system: ein vektpakke blir til i databasen i det etiketten blir skriven ut.

**Vektvarer (kjøt)** – éin rad per pakke: pakke-ID, produkt, gram, kr, kilopris, pakkedato, best før, parti, Nortura-referanse, status (`lager` → `reservert` → `seld`, eller `uttak`/`svinn`).

**Mottak frå Nortura** – ferdig vakuumerte stykningsdelar med Nortura-lapp:
1. Registrer leveransen éin gong: referansenummer, slakteri (godkj.nr.), skjeringsanlegg (godkj.nr.), slaktedato. Gjeld alle pakkane i leveransen.
2. Per pakke: skann Nortura-strekkoden (GS1-128 gir truleg vekt, dato og parti – må stadfestast med bilete av ein ekte lapp) eller vekt på vekta. Vel produkt.
3. Skriv ut eigen etikett og lim han over. Nortura-partiet blir lagra saman med vår pakke-ID for sporing.

**Krav til eigen kjøtetikett (ferskt storfe, forordning 1760/2000 art. 13 via forskrift 2010-07-09-1131)** – ovalt ID-merke/EFTA-nummer åleine er ikkje nok:
- Referansenummer (koplar kjøtet til dyret/partiet)
- «Slaktet i: Norge (godkjenningsnummer)»
- «Nedskåret i: Norge (godkjenningsnummer)»
- «Opprinnelse: Norge» (erstattar født/oppdrettet/slaktet når alt er i Noreg)
- Kverna kjøt (kjøtdeig): referansenummer, «Slaktet i» og «Kvernet i»
- I tillegg dei vanlege krava: namn, vekt, pris, best før/siste forbruksdag, oppbevaring, produsent
`etikettar/maler.js` har allereie felta (Opphav, Slakta i, Skore i, Ref.nr.). Teksten bør vurderast mot ordlyden over.

**Stk-varer (egg, mjølk, kasser)** – ingen etikett per eining. Talt per produkt og parti:
- Egg: vegg-skilt med hyllekode (`etikettar/eggplakat.html`). Inn på lager via ein knapp «+ brett» på lagersida (tal brett, dato lagt/pakka). Sal trekkjer frå.
- Mjølk: «+ flasker» ved tapping. Glasflasker: eiga teljing (ut ved sal, inn ved byte) så ein ser kor mange som er ute hos kundar.

**Lagersida** (mobil, berre for oss): beholdning per produkt (stk, kg, eldste best før), knappar for innlegging av stk-varer, «uttak/svinn» per pakke ved skanning. Varsel i Home Assistant når best før nærmar seg.

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
- [ ] Skannaren i sida les kodar på 20–40 cm avstand, også i dårleg lys (simulert 18.11: 10–35 cm for kjøt, 10–40 cm for mjølk; ekte telefonar står att)
- [ ] Lys: slår seg på av seg sjølv etter ca. 1,5 s i mørker (Android Chrome, iPhone iOS 17+), lysknappen slår av/på, og lyset slår seg ikkje på att etter at kunden har slått det av (testa med simulert kamera 18.11)
- [ ] Telefon utan lysstøtte: tipset «For mørkt?» kjem fram
- [ ] Hovudkameraet blir valt (ikkje vidvinkel/tele), og valet blir hugsa til neste gong (testa med simulerte kameranamn for iPhone, Android og norsk iOS 18.11)
- [ ] Lysknappen er alltid synleg. Melder kameraet at lys ikkje går, prøver sida dei andre bakkamera (Android med fleire linser)
- [ ] Lys og blank vakuumpose: gjenskin hindrar ikkje lesing (matt etikett)
- [ ] Same vektpakke to gonger → «ligg alt i korga … skann kvar av dei» (testa i nettlesar 18.11)
- [ ] Stk-varer (egg, mjølk, flaske, kasser) har − og +. Vektvarer har berre «Fjern» (eigen kode per pakke)
- [ ] Betalt pakke skanna på nytt → «alt seld»
- [ ] Endra kode → «Ukjend eller endra kode»
- [ ] Mjølk: begge val i dialogen, +/- på mjølk og flaske, flaskelinja følgjer mjølka ned
- [ ] Sum og mva stemmer (mva = sum × 15/115)
- [ ] Korga overlever at sida blir lukka og opna igjen
- [ ] «Nullstill testdata» tømer alt

**Visuelt**
- [ ] Etikett lesbar på armlengds avstand, QR minst 20–25 mm med 4 modular kvit sone (malane i `etikettar/`)
- [ ] Utskrift på etikettskrivar (vakuumpose, kald og fuktig overflate)
- [ ] Blekkskrivar: etikett på vakuumpose, 24 t i frysaren, ut i romtemperatur med kondens, gni på trykket. Les QR etterpå
- [ ] Eggplakaten: skann begge kodane frå 40–60 cm
- [ ] Botnlinja dekkjer ikkje innhald på liten skjerm
- [ ] Dørplakaten forstått av nokon som ikkje har sett løysinga før

## Skannar (18.11.2026)
Kassa ber om HD-video og les eit utsnitt rundt ramma i full oppløysing (annankvar gong heile biletet).
`BarcodeDetector` blir brukt der nettlesaren har han. Før: heile biletet nedskalert til 480 px, som gav om lag 10 cm rekkjevidd.

## Arbeidsflyt
```
python3 build.py
git add -A && git commit -m "..." && git push
```
GitHub Pages publiserer automatisk frå `main` i løpet av eit minutt.
