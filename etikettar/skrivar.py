#!/usr/bin/env python3
"""Etikettstasjon for Fredheim gard – køyrer på Huben (berre lokalt nett).

Les vekta over USB/serieport, viser etikettsida (skrivar.html) og sender ferdig ZPL
til etikettskrivaren. Vekta reknar ingenting: ho sender berre vekt. Pris blir rekna her
og står på etiketten og i QR-koden.

  python3 skrivar.py                 # brukar skrivar.json i same mappe
  python3 skrivar.py --test          # utan vekt og skrivar: ZPL blir lagra i data/utskrift/

Treng berre Python 3. For vekt på USB/serieport: pip install pyserial
Ingen port skal opnast inn frå internett (sjå OVERLEVERING.md, krav 6).
"""
import json, os, re, socket, sys, time, threading, csv, datetime
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse

MAPPE = Path(__file__).resolve().parent
REPO = MAPPE.parent
DATA = MAPPE / 'data'
STANDARD = {
    "lytt": "0.0.0.0", "port": 8080,
    "skrivar": {"type": "tcp", "adresse": "192.168.1.50", "port": 9100},
    "vekt": {"port": "/dev/ttyUSB0", "baud": 9600, "kommando": "", "les_sekund": 0.8},
    "butikk": "https://dskorge.github.io/Fredheim-butikk/",
}
TEST = '--test' in sys.argv
LAAS = threading.Lock()


def konfig():
    f = MAPPE / 'skrivar.json'
    k = json.loads(json.dumps(STANDARD))
    if f.exists():
        for nk, v in json.loads(f.read_text(encoding='utf-8')).items():
            if isinstance(v, dict) and isinstance(k.get(nk), dict): k[nk].update(v)
            else: k[nk] = v
    return k


K = konfig()
DATA.mkdir(exist_ok=True)


# ---------- Vekt ----------
TAL = re.compile(r'([+-]?\s*\d+(?:[.,]\d+)?)\s*(kg|g)?', re.I)


def tolk_vekt(raa: str):
    """Finn siste vektverdi i teksten frå vekta. Godtek t.d. 'ST,GS,+  1.035kg', '   1035 g', 'W 1,035 kg'.
    Returnerer (gram, stabil) eller (None, False)."""
    beste = None
    for linje in re.split(r'[\r\n]+', raa):
        if not linje.strip():
            continue
        treff = [m for m in TAL.finditer(linje) if re.search(r'\d', m.group(1))]
        if not treff:
            continue
        m = treff[-1]
        verdi = float(m.group(1).replace(' ', '').replace(',', '.'))
        eining = (m.group(2) or '').lower()
        if eining == 'kg' or (not eining and '.' in m.group(1).replace(',', '.')):
            g = round(verdi * 1000)
        else:
            g = round(verdi)
        ustabil = bool(re.search(r'\bUS\b|\bM\b|ustabil|motion', linje, re.I))
        beste = (g, not ustabil)
    return beste or (None, False)


def les_vekt():
    if TEST:
        return {"g": 1035, "stabil": True, "raa": "TEST 1.035 kg"}
    try:
        import serial  # pyserial
    except ImportError:
        raise RuntimeError('pyserial manglar: pip install pyserial')
    v = K['vekt']
    with serial.Serial(v['port'], v.get('baud', 9600), timeout=0.2) as s:
        s.reset_input_buffer()
        if v.get('kommando'):
            s.write(v['kommando'].encode().decode('unicode_escape').encode('latin-1'))
        slutt = time.time() + float(v.get('les_sekund', 0.8)); buf = b''
        while time.time() < slutt:
            buf += s.read(256)
    raa = buf.decode('latin-1', 'replace')
    g, stabil = tolk_vekt(raa)
    if g is None:
        raise RuntimeError('Fekk ikkje vekt frå vekta (sjå "raa"): ' + raa[-80:])
    return {"g": g, "stabil": stabil, "raa": raa[-80:]}


# ---------- Skrivar ----------
def send_zpl(zpl: str):
    if TEST:
        d = DATA / 'utskrift'; d.mkdir(exist_ok=True)
        f = d / (datetime.datetime.now().strftime('%Y%m%d-%H%M%S-%f') + '.zpl'); f.write_text(zpl, encoding='utf-8')
        return 'lagra ' + f.name
    s = K['skrivar']
    data = zpl.encode('utf-8')
    if s['type'] == 'tcp':
        with socket.create_connection((s['adresse'], int(s.get('port', 9100))), timeout=10) as c:
            c.sendall(data)
        return 'sendt til %s:%s' % (s['adresse'], s.get('port', 9100))
    if s['type'] == 'fil':  # t.d. /dev/usb/lp0 når skrivaren står i USB på Huben
        with open(s['sti'], 'wb') as f:
            f.write(data)
        return 'skrive til ' + s['sti']
    raise RuntimeError('Ukjend skrivartype: ' + s['type'])


# ---------- Teljar og logg (sporing) ----------
def neste_id(prefiks='P'):
    with LAAS:
        f = DATA / 'teljar.json'
        t = json.loads(f.read_text()) if f.exists() else {}
        n = t.get(prefiks, 1000) + 1
        t[prefiks] = n
        f.write_text(json.dumps(t))
    return '%s%d' % (prefiks, n)


LOGG_FELT = ['tid', 'pakke', 'produkt', 'namn', 'gram', 'kr', 'kgpris', 'parti', 'ref', 'slakteri', 'skjering', 'fryst', 'pakka', 'best_for', 'kode', 'modus', 'kopiar',
             'slakta', 'morna', 'holdbar', 'utskrift']


def logg(rad: dict):
    f = DATA / 'pakkar.csv'; ny = not f.exists()
    with LAAS, open(f, 'a', newline='', encoding='utf-8') as o:
        w = csv.DictWriter(o, LOGG_FELT, extrasaction='ignore', delimiter=';')
        if ny: w.writeheader()
        w.writerow(dict(rad, tid=datetime.datetime.now().isoformat(timespec='seconds')))


def lagra(namn, data=None):
    f = DATA / (namn + '.json')
    if data is None:
        return json.loads(f.read_text(encoding='utf-8')) if f.exists() else None
    f.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding='utf-8')
    return data


# ---------- Vevtenar ----------
TYPAR = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.json': 'application/json'}


class H(BaseHTTPRequestHandler):
    def svar(self, kode, data, typ='application/json; charset=utf-8'):
        b = data if isinstance(data, bytes) else json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(kode); self.send_header('Content-Type', typ); self.send_header('Content-Length', str(len(b)))
        self.send_header('Cache-Control', 'no-store'); self.end_headers(); self.wfile.write(b)

    def log_message(self, *a):
        pass

    def do_GET(self):
        p = urlparse(self.path).path
        try:
            if p == '/api/status':
                return self.svar(200, {"test": TEST, "skrivar": K['skrivar'], "vekt": K['vekt'].get('port'), "butikk": K['butikk']})
            if p == '/api/vekt':
                return self.svar(200, les_vekt())
            if p in ('/api/partier', '/api/prisar'):
                return self.svar(200, lagra(p[5:]) or [] if p.endswith('partier') else lagra(p[5:]) or {})
        except Exception as e:
            return self.svar(503, {"feil": str(e)})
        # statiske filer: etikettar/ og src/ (QR-biblioteket)
        if p in ('/', '', '/etikettar', '/etikettar/'):
            self.send_response(302); self.send_header('Location', '/etikettar/skrivar.html'); self.end_headers(); return
        f = (REPO / p.lstrip('/')).resolve()
        if not (str(f).startswith(str(MAPPE)) or str(f).startswith(str(REPO / 'src'))) or 'data' in f.relative_to(REPO).parts or not f.is_file():
            return self.svar(404, {"feil": "finst ikkje"})
        return self.svar(200, f.read_bytes(), TYPAR.get(f.suffix, 'application/octet-stream'))

    def do_POST(self):
        p = urlparse(self.path).path
        try:
            n = int(self.headers.get('Content-Length') or 0)
            d = json.loads(self.rfile.read(n) or b'{}')
            if p == '/api/neste':
                return self.svar(200, {"id": neste_id(d.get('prefiks', 'P'))})
            if p == '/api/skriv':
                r = send_zpl(d['zpl'])
                if d.get('logg'): logg(d['logg'])
                return self.svar(200, {"ok": True, "melding": r})
            if p == '/api/logg':  # A4-ark frå blekkskrivaren: berre logg, ingen ZPL
                for rad in d.get('rader', []): logg(rad)
                return self.svar(200, {"ok": True, "tal": len(d.get('rader', []))})
            if p in ('/api/partier', '/api/prisar'):
                return self.svar(200, lagra(p[5:], d))
        except Exception as e:
            return self.svar(500, {"feil": str(e)})
        return self.svar(404, {"feil": "ukjend"})


if __name__ == '__main__':
    srv = ThreadingHTTPServer((K['lytt'], int(K['port'])), H)
    print('Etikettstasjon på http://%s:%s/%s' % (K['lytt'], K['port'], '  (TESTMODUS)' if TEST else ''))
    srv.serve_forever()
