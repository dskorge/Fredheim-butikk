# Fredheim gard – gardsbutikken (prototype)

Sjølvbetent skann-og-betal for gardsbutikken på Fredheim gard. **Testmodus: betalinga er simulert.**

- `index.html` – ferdig bygd side (det GitHub Pages viser)
- `src/` – kjelda: `shell.html` (HTML og CSS), `app.js` (logikk), logo og QR-bibliotek
- `build.py` – byggjer `index.html` frå `src/`

Sider: `/` butikken, `#etikettar` testetikettar til utskrift.

Bibliotek: [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (MIT) og [jsQR](https://github.com/cozmo/jsQR) (Apache-2.0).

Neste steg: Vipps ePayment-API i staden for simulert betaling, og signerte koder frå Huben.
