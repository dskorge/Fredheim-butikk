#!/usr/bin/env python3
"""Byggjer index.html frå src/: shell.html med logo, QR-bibliotek og app.js lagt inn."""
from pathlib import Path
s = Path('src')
out = (s / 'shell.html').read_text()
for key, f in [('__LOGO__', 'logo.svg'), ('__QR__', 'qr.min.js'), ('__JSQR__', 'jsqr.min.js'), ('__APP__', 'app.js')]:
    out = out.replace(key, (s / f).read_text().strip())
Path('index.html').write_text(out)
print('index.html:', len(out), 'byte')
