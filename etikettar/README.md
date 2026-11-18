# Etikettar – Fredheim gard

Etikettmalar, etikettstasjon og testar for gardsbutikken. Stilretning B «Fjellband» (valt 18.11.2026).
Kodane følgjer F1-formatet i [`OVERLEVERING.md`](../OVERLEVERING.md). Formatet er ikkje endra.

## Filer

| Fil | Innhald |
|---|---|
| `maler.js` | Malane: kjøt 100 × 70, kjøtkasse 100 × 150, mjølk 80 × 100, egg 63,5 × 38,1 mm. SVG → 203 dpi → ZPL |
| `fjell.js` | Fjellet frå logoen (utan ordmerke) |
| `produkt.js` | Varer på etikettstasjonen. Nøklane må finnast i `PROD` i `src/app.js` |
| `skrivar.html` + `skrivar.py` | Etikettstasjonen på Huben: vekt inn (USB), etikett ut (ZPL) |
| `egg.html` | Eggetikettar på A4 (21 per ark) frå vanleg skrivar |
| `testark.html` | Alle etikettane i 1 : 1 for utskrift og skannetest |
| `trykkfiler/` | Fortrykket i farge med 2 mm utfall (PDF og SVG) – underlag til trykkeriet |
| `utskrift/` | Ferdige PDF-ar: testark og eggark |
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
- Pakke-ID kjem frå ein teljar i `data/teljar.json` (P1001, P1002 …).
- Lyttar berre på lokalt nett. Ingen port blir opna inn frå internett.

## Etikettrullar (ZD421t: kjerne 25 mm, ytre diameter maks 127 mm, breidd maks 112 mm)

| Etikett | Mål (mm) | Materiale | Lim | Ca. per rull |
|---|---|---|---|---|
| Kjøt | 100 × 70, 3 mm mellomrom | Termotransfer-papir med toppbelegg (fortrykt eller blankt) | Frysefast (all-temp), skal tole −25 °C og kondens | 1 000 |
| Kjøtkasse | 100 × 150, 3 mm mellomrom | Termotransfer-papir, blankt | Frysefast | 450 |
| Mjølk | 80 × 100, 3 mm mellomrom | Termotransfer-papir med toppbelegg (fortrykt) | Wash-off (løyser seg i vatn frå ca. 21 °C, best ved 60 °C) | 750 |
| Egg | 63,5 × 38,1, 21 per A4 | Papiretikettar for laser/blekk (Avery L7160, Herma 4677 o.l.) | Permanent | – |

Fargeband: voks/resin, 110 mm × 74 m (tåler kondens og frys betre enn rein voks).

Fortrykk: Fjellbrun `#5C4433`, Råmjølk `#F3ECDB` og NRF-raud `#A44A2A`. Toppbelegg som kan trykkjast på med termotransfer.
Utstansa, éin i breidda, vikla med trykket ut. Bestill prøvetrykk før heile opplaget.

## Testar (18.11.2026)

- `node etikettar/test/sjekk.js` – alle varer på stasjonen finst i kassa.
- `python3 etikettar/test/kassatest.py` – falsk kamera med termoutskrift (203 dpi) av etiketten, gjennom kassa i `index.html`.
  Resultat: kjøt og kjøtkasse blir lesne frå 10 til 35 cm, mjølk frå 10 til 40 cm og egg frå 10 til 30 cm.
  Den gamle kassa las berre på ca. 10 cm.
- Alle kodane på `utskrift/testark_A4.pdf` og `utskrift/egg_A4_12stk.pdf` er lesne att frå 600 dpi.
- ZPL frå stasjonen er gjort om til bilete att, og QR-en er lesen.

Simuleringa erstattar ikkje ein test med ekte telefonar. Sjå testplanen i `OVERLEVERING.md`.
