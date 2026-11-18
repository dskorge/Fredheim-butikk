# Etikettar – Fredheim gard

Etikettmalar, etikettstasjon og testar for gardsbutikken. Stilretning B «Fjellband» (valt 18.11.2026).
Kodane følgjer F1-formatet i [`OVERLEVERING.md`](../OVERLEVERING.md). Formatet er ikkje endra.

## Filer

| Fil | Innhald |
|---|---|
| `maler.js` | Malane: kjøt 100 × 70, kjøtkasse 100 × 150, mjølk 80 × 100, egg 63,5 × 38,1 mm. SVG → 203 dpi → ZPL |
| `fjell.js` | Fjellet frå logoen (utan ordmerke) |
| `produkt.js` | Varer på etikettstasjonen. Nøklane må finnast i `PROD` i `src/app.js` |
| `skrivar.html` + `skrivar.py` | Etikettstasjonen: A4-ark i blekkskrivar (no) eller etikettskrivar med ZPL (seinare). Vekt inn over USB på Huben |
| `eggplakat.html` | Plakat over eggene (A4/A3) med éin QR per vare. Egga har ingen etikett |
| `testark.html` | Alle etikettane i 1 : 1 for utskrift og skannetest |
| `trykkfiler/` | Fortrykket i farge med 2 mm utfall (PDF og SVG) – underlag til trykkeriet |
| `utskrift/` | Ferdige PDF-ar: testark (termostorleik), prøveark for blekkskrivar, eggplakat |
| `fonts/` | Fraunces og Instrument Sans (SIL OFL 1.1) |
| `test/` | `sjekk.js` (varer finst i kassa), `kassatest.py` (skannetest med falsk kamera) |

## Fire modusar

- `blank` – alt i svart på kvit. For blank rull, eller før fortrykte rullar er komne.
- `overtrykk` – berre dei variable felta i svart. For fortrykt rull.
- `trykk` – berre det faste trykket i farge. Til trykkeriet.
- `samla` – fortrykk + overtrykk. Slik den ferdige etiketten ser ut.

Fast trykk (logo, fjell, overskrifter, adresse) og variable felt (namn, vekt, pris, datoar, opphav, QR) ligg på
ulike stader på etiketten, så overtrykket ikkje treng å treffe meir nøyaktig enn ±0,5 mm.

QR-koden blir alltid skriven av etikettskrivaren, ikkje fortrykt: adressa i koden blir endra når butikken flyttar til eige domene og Vipps.

## No: blekkskrivar (Brother MFC-J5740DW) og A4-ark

Kjøtsalet startar før etikettskrivaren er kjøpt. Etikettstasjonen kan skrive ut i farge på A4-etikettark:

1. Opne `etikettar/skrivar.html` (på GitHub Pages: `https://dskorge.github.io/Fredheim-butikk/etikettar/skrivar.html`,
   eller på Huben). Utan Huben går sida i demomodus: pakke-ID-teljar og logg ligg i nettlesaren (same PC kvar gong).
2. «Skrivar: A4-ark i blekkskrivar». Vel ark: kjøt og kjøtkasse har kvar sitt format.
3. Fyll inn parti (slaktedato, ref.nr., godkjenningsnummer, fryst/fersk, holdbarheit) og «Lagra parti».
4. Vel vare, skriv inn vekta frå den godkjende vekta, trykk «Legg på arket». Kvar etikett får eigen pakke-ID.
5. «Skriv ut ark» → nettlesaren sin utskriftsdialog. Etikettane blir logga, og neste ark startar på første ledige plass.
6. Etiketter som ikkje blir brukte: arket kan gå i skrivaren att, «Start på etikett nr.» hoppar over dei brukte.

| Ark | Mål (mm) | Bruk | Materiale |
|---|---|---|---|
| Herma 4598 (40 stk) / 4599 (160 stk) | 105 × 148, 4 per A4 | Kjøtkasse heil, kjøt delt i to (105 × 74, 8 per A4) | Vêrbestandig film for blekk |
| Avery J8165 | 99,1 × 67,7, 8 per A4 | Kjøt | Papir (ikkje for kondens) |
| Avery J8169 | 99,1 × 139, 4 per A4 | Kjøtkasse på papp | Papir |
| Vanleg A4 | som Herma 4598 | Prøveutskrift og kalibrering | – |

- **Kjøt på Herma 4598:** nedste halvdel av kvar etikett er snudd 180°. Kutt kvart ark tvers over ved 74,5 mm og
  222,5 mm frå øvre arkkant (to kutt gir 8 etikettar). Snittet går mellom to lyse felt, så små avvik synest ikkje.
- **Utfall:** bandet og fjellet går 0,8 mm ut over kanten der det er arkkant, mellomrom eller band mot band.
  Mot ein lys nabo blir det ikkje utfall.
- **Kalibrering:** skriv ut kalibreringsarket på vanleg papir, mål strekane og skriv inn måla. Sida reknar ut flytting
  og skala. Brother skriv ikkje dei ytste ca. 3 mm av arket utan «utskrift utan kantar», og den funksjonen forstørrar biletet litt.
- **Utskrift:** eitt ark om gongen i den manuelle matinga, 100 % / faktisk storleik, «Høg» kvalitet,
  papirtype for blekkskrivarpapir (film: prøv «Anna glanset papir»). Slå av topptekst og botntekst i nettlesaren.
- Svart blekk (LC3219XL BK) er pigment og tåler vatn godt. Test fargane på filmen med kondens før sal.

## Datoar på kjøt (18.11.2026)

- **Slakta den** og **mørning** (døgn frå slakt til frysing/pakking) står alltid på kjøt og kjøtkasse.
- **Fryst vare:** «Fryst den» (krav) og «Best før». «Oppbevarast fryst ved −18 °C. Tin i kjøleskap.»
- **Fersk vare:** «Best før» eller «Siste forbruksdag» og «Kan frysast før datoen». Er «Mørna til» sett og
  seinare enn pakkedatoen, står «Mørna til <dato>» og «Frys etter mørninga».
- Holdbarheit «Auto»: kjøtdeig/karbonadedeig får «Siste forbruksdag», heile stykke «Best før». Kan overstyrast.

## Etikettstasjonen (Huben)

```
cd etikettar
cp skrivar.json.eksempel skrivar.json     # set IP til skrivaren og porten til vekta
pip install pyserial                       # berre om vekta står i USB/serieport
python3 skrivar.py                          # opne http://<huben>:8080/
python3 skrivar.py --test                   # utan vekt og skrivar: ZPL blir lagra i data/utskrift/
```

- Vekta treng ikkje rekne noko. Ho må vere godkjend for kjøp og sal (klasse III) og sende vekt over USB/RS-232.
  `skrivar.py` les teksten frå vekta og finn vekta i han (t.d. `ST,GS,+  1.035kg`). Linjer med `US` (ustabil) blir merkte.
- Pris = kilopris × vekt, avrunda til heile kroner (som i koden). Kilopris blir hugsa per vare.
- Etiketten blir teikna i nettlesaren med rette skrifter, gjord om til 1-bit på 8 punkt/mm og send som ZPL (`^GFA`).
  Skrivaren: TCP 9100 (nettverk) eller `/dev/usb/lp0` (USB på Huben).
- Kvar utskrift blir logga i `data/pakkar.csv` (pakke-ID, vekt, pris, parti, ref.nr., godkjenningsnummer, datoar, kode). Det er sporinga.
  A4-ark blir logga via `POST /api/logg`. I demomodus: «Last ned logg (CSV)».
- Pakke-ID kjem frå ein teljar i `data/teljar.json` (P1001, P1002 …).
- Lyttar berre på lokalt nett. Ingen port blir opna inn frå internett.

## Etikettrullar (ZD421t: kjerne 25 mm, ytre diameter maks 127 mm, breidd maks 112 mm)

| Etikett | Mål (mm) | Materiale | Lim | Ca. per rull |
|---|---|---|---|---|
| Kjøt | 100 × 70, 3 mm mellomrom | Termotransfer-papir med toppbelegg (fortrykt eller blankt) | Frysefast (all-temp), skal tole −25 °C og kondens | 1 000 |
| Kjøtkasse | 100 × 150, 3 mm mellomrom | Termotransfer-papir, blankt | Frysefast | 450 |
| Mjølk | 80 × 100, 3 mm mellomrom | Termotransfer-papir med toppbelegg (fortrykt) | Wash-off (løyser seg i vatn frå ca. 21 °C, best ved 60 °C) | 750 |

Fargeband: voks/resin, 110 mm × 74 m (tåler kondens og frys betre enn rein voks).

Fortrykk: Fjellbrun `#5C4433`, Råmjølk `#F3ECDB` og NRF-raud `#A44A2A`. Toppbelegg som kan trykkjast på med termotransfer.
Utstansa, éin i breidda, vikla med trykket ut. Bestill prøvetrykk før heile opplaget.

## Testar (18.11.2026)

- `node etikettar/test/sjekk.js` – alle varer på stasjonen finst i kassa.
- `python3 etikettar/test/kassatest.py` – falsk kamera med termoutskrift (203 dpi) av etiketten, gjennom kassa i `index.html`.
  Resultat: kjøt og kjøtkasse blir lesne frå 10 til 35 cm, mjølk frå 10 til 40 cm og egg frå 10 til 30 cm.
  Den gamle kassa las berre på ca. 10 cm.
- Alle kodane på `utskrift/testark_A4.pdf` er lesne att frå 600 dpi.
- A4-modus (18.11): 6 kjøt og 2 kasser lagde i stasjonen, skrivne til PDF (`utskrift/blekk_proveark_A4.pdf`)
  og lesne att frå 600 dpi med jsQR (same lesar som kassa), også dei snudde. Eggplakaten: begge kodane lesne.
- ZPL frå stasjonen er gjort om til bilete att, og QR-en er lesen.

Simuleringa erstattar ikkje ein test med ekte telefonar. Sjå testplanen i `OVERLEVERING.md`.
