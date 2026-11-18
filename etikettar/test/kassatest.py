"""Kassatest: falsk kamera (y4m) med termoutskrift (203 dpi) av etiketten -> kassa i butikk-sida -> ligg vara i korga?

Krev: python3 -m pip install playwright pillow numpy  og Chrome/Chromium.
Køyr frå rota av repoet:
  python3 -m http.server 8765 &      # butikken (ny versjon)
  python3 etikettar/test/kassatest.py [gamal-kassa-url]
Avstanden er simulert: 1080 px i videoen dekkjer om lag like mange mm som avstanden (ca. 53° synsfelt).
"""
import sys, json, base64, subprocess, time
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
from playwright.sync_api import sync_playwright

W = Path(__file__).resolve().parent / 'kassatest'; W.mkdir(exist_ok=True)
LIVE = 'https://dskorge.github.io/Fredheim-butikk/'
import shutil, os
CHROME = os.environ.get('CHROME') or shutil.which('google-chrome') or shutil.which('chromium')
GAMAL = sys.argv[1] if len(sys.argv) > 1 else None

# 1) Lag etikettane på 203 dpi med live-adressa i koden
JS = """async (base) => { const E = window.FH_ETIKETT, css = await E.lastFontCss('fonts/'), T = window.FH_TEST;
 const kjot = Object.assign({}, T.morbrad, {kode: E.pakkeKode(base, {id:'P9001', produkt:'morbrad', g:1035, kr:568, dato:'181126', parti:'B2611'})});
 const kasse = Object.assign({}, T.kasse, {kode: E.pakkeKode(base, {id:'P9003', produkt:'familie', g:10240, kr:2890, dato:'181126', parti:'B2611'})});
 const mjolk = Object.assign({}, T.mjolk, {kode: E.hylleKode(base, 'mjolk')});
 const out = {};
 for (const [k, fn, d] of [['kjot', E.kjot, kjot], ['kasse', E.kasse, kasse], ['mjolk', E.mjolk, mjolk]]) {
   const et = fn(d, {modus:'blank', fontCss: css}); const c = await E.teikn(et.svg, et.w, et.h); out[k] = {png: c.toDataURL(), qr: et.qr, kode: d.kode}; }
 return out; }"""
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])
    pg = b.new_page(); pg.goto('http://localhost:8765/etikettar/testark.html'); pg.wait_for_selector('body[data-klar="1"]')
    et = pg.evaluate(JS, LIVE); b.close()
for k, v in et.items():
    open(W / f'{k}.png', 'wb').write(base64.b64decode(v['png'].split(',')[1]))
    print(k, v['qr'], v['kode'])

def y4m(label_png, qr, d_cm, fn, seed=1):
    """1920x1080-ramme der QR-midten ligg midt i kassa-ramma. 1080 px ≈ d mm (ca. 53° synsfelt)."""
    rng = np.random.default_rng(seed)
    lab = Image.open(label_png).convert('L')            # 8 punkt/mm
    pxmm = 1080 / (d_cm * 10)
    sc = pxmm / 8
    lw, lh = max(1, round(lab.width * sc)), max(1, round(lab.height * sc))
    small = lab.filter(ImageFilter.GaussianBlur(max(0.4, 0.5 / sc))).resize((lw, lh), Image.LANCZOS).rotate(5, resample=Image.BICUBIC, expand=True, fillcolor=255)
    cx_mm = qr['x'] + qr['side_mm'] / 2; cy_mm = qr['y'] + qr['side_mm'] / 2
    ox = round(960 - cx_mm * pxmm); oy = round(540 - cy_mm * pxmm)
    frames = []
    for i in range(6):
        f = Image.new('L', (1920, 1080), 140); f.paste(small, (ox, oy))
        a = np.asarray(f, np.float32) / 255.0
        a = 45 + a * (205 - 45)
        xx = np.linspace(0.85, 1.0, 1920)[None, :]; a = a * xx
        a += rng.normal(0, 4, a.shape)
        f = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.5))
        frames.append(np.asarray(f))
    with open(fn, 'wb') as o:
        o.write(b'YUV4MPEG2 W1920 H1080 F10:1 Ip A1:1 C420jpeg\n')
        uv = np.full((540, 960), 128, np.uint8).tobytes()
        for fr in frames:
            o.write(b'FRAME\n'); o.write(fr.tobytes()); o.write(uv); o.write(uv)

def kassa(url, video):
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROME, args=['--no-sandbox', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', f'--use-file-for-fake-video-capture={video}'])
        ctx = b.new_context(viewport={'width': 1280, 'height': 720}); ctx.grant_permissions(['camera'])
        pg = ctx.new_page(); pg.goto(url); pg.evaluate('localStorage.clear()'); pg.reload()
        pg.click('#skann')
        ok = False; t0 = time.time()
        while time.time() - t0 < 6:
            st = pg.evaluate("""() => ({korg: (JSON.parse(localStorage.getItem('fh_korg2')||'[]')).length, dlg: document.querySelector('#pantDlg') && document.querySelector('#pantDlg').open, toast: (document.querySelector('#toast')||{}).textContent||''})""")
            if st['korg'] > 0 or st['dlg']: ok = True; break
            if 'Kjenner ikkje' in st['toast'] or 'Ukjend' in st['toast']: break
            pg.wait_for_timeout(200)
        b.close()
        return ok, st

res = []
for k in ['kjot', 'mjolk', 'kasse']:
    for d in [10, 15, 20, 25, 30, 35, 40]:
        v = W / f'{k}_{d}.y4m'; y4m(W / f'{k}.png', et[k]['qr'], d, v)
        for namn, url in [('ny kassa', 'http://localhost:8765/index.html')] + ([('gamal kassa', GAMAL)] if GAMAL else []):
            ok, st = kassa(url, v)
            res.append({'etikett': k, 'cm': d, 'kassa': namn, 'ok': ok, 'toast': st['toast'][:40]})
            print(k, d, namn, 'OK' if ok else '--', st['toast'][:50], flush=True)
        v.unlink()
json.dump(res, open(W / 'resultat.json', 'w'), ensure_ascii=False, indent=1)
