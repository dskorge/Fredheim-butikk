/* Fredheim gard – etikettmalar (stilretning B «Fjellband»).
 *
 * Kvar mal gir ein SVG i millimeter. Fire modusar:
 *   'blank'     – alt i svart på kvit, for blank rull i termoskrivaren
 *   'overtrykk' – berre dei variable felta, for fortrykt rull
 *   'trykk'     – berre det faste trykket i farge (underlag til trykkeriet)
 *   'samla'     – fortrykk i farge + overtrykk i svart (slik den ferdige etiketten ser ut)
 *
 * QR-koden blir teikna med heile punkt på skrivaren (8 punkt/mm = 203 dpi),
 * med minst 4 modular kvit sone rundt. Kodeformatet er F1 frå OVERLEVERING.md.
 *
 * Krev: window.qrcode (src/qr.min.js) og window.FH_FJELL (fjell.js).
 */
(function () {
  'use strict';

  var DPMM = 8; // punkt per mm på ein 203 dpi-skrivar
  var FARGE = { fjellbrun: '#5C4433', ramjolk: '#F3ECDB', lysbrun: '#7D5E45', raud: '#A44A2A' };
  var SER = "Fraunces, Georgia, serif", SAN = "'Instrument Sans', Arial, sans-serif";
  var ADR = { namn: 'Fredheim gard', veg: 'Vanylvsvegen 642', post: '6142 Eidså' };

  // ---------- Hjelparar ----------
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function f(n) { return Math.round(n * 1000) / 1000; }

  var maalCanvas = null;
  // Breidd på tekst i mm (font-storleik i mm)
  function breidd(tekst, storleik, familie, vekt, sperring) {
    if (typeof document === 'undefined') return tekst.length * storleik * 0.55;
    maalCanvas = maalCanvas || document.createElement('canvas');
    var x = maalCanvas.getContext('2d');
    x.font = (vekt || 400) + ' 100px ' + familie;
    var w = x.measureText(tekst).width / 100 * storleik;
    return w + (sperring || 0) * storleik * Math.max(0, tekst.length - 1);
  }

  // Tekst: o = { s: storleik mm, d: true (Fraunces), v: vekt, f: farge, a: 'end'|'middle', sp: sperring em, maks: mm }
  function tekst(x, y, t, o) {
    o = o || {};
    var fam = o.d ? SER : SAN, s = o.s || 2.5, v = o.v || 400, sp = o.sp || 0, ekstra = '';
    if (o.maks) {
      var w = breidd(t, s, fam, v, sp);
      if (w > o.maks) {
        var ny = Math.max(s * 0.72, s * o.maks / w);
        if (breidd(t, ny, fam, v, sp) > o.maks) ekstra = ' textLength="' + f(o.maks) + '" lengthAdjust="spacingAndGlyphs"';
        s = ny;
      }
    }
    return '<text x="' + f(x) + '" y="' + f(y) + '" font-family="' + fam + '" font-size="' + f(s) + '" font-weight="' + v + '"' +
      (sp ? ' letter-spacing="' + f(sp * s) + '"' : '') + (o.a ? ' text-anchor="' + o.a + '"' : '') +
      ' fill="' + (o.f || '#000') + '"' + ekstra + '>' + esc(t) + '</text>';
  }
  function linje(x1, y1, x2, y2, b, farge) { return '<line x1="' + f(x1) + '" y1="' + f(y1) + '" x2="' + f(x2) + '" y2="' + f(y2) + '" stroke="' + farge + '" stroke-width="' + f(b) + '"/>'; }
  function rekt(x, y, w, h, farge) { return '<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(h) + '" fill="' + farge + '"/>'; }
  function fjell(x, y, w, farge) {
    var F = window.FH_FJELL, k = w / F.w;
    return '<g transform="translate(' + f(x) + ' ' + f(y) + ') scale(' + f(k) + ')" fill="' + farge + '"><polygon points="' + F.poly + '"/><path fill-rule="evenodd" d="' + F.d + '"/></g>';
  }
  // Ved utfallande kant: før fjellet vidare ut i utfallet på høgre side (fjellet går til kanten der).
  function fjellUtfall(x, y, w, farge, u) {
    if (!u) return '';
    var k = w / window.FH_FJELL.w;
    return rekt(x + w - 0.05, y + 36.2 * k, u + 0.1, fjellH(w) - 36.2 * k + 0.05, farge);
  }
  function fjellH(w) { return w * window.FH_FJELL.h / window.FH_FJELL.w; }

  // QR med heile punkt. boks = [x0, y0, storleik] i punkt; modul = punkt per modul (maks).
  function qr(data, boks, modul, farge) {
    var q = window.qrcode(0, 'M'); q.addData(data); q.make();
    var n = q.getModuleCount();
    while (modul > 3 && n * modul > boks[2]) modul--;
    var side = n * modul, ox = boks[0] + Math.floor((boks[2] - side) / 2), oy = boks[1] + Math.floor((boks[2] - side) / 2);
    var d = '';
    for (var r = 0; r < n; r++) {
      var c0 = -1;
      for (var c = 0; c <= n; c++) {
        var on = c < n && q.isDark(r, c);
        if (on && c0 < 0) c0 = c;
        if (!on && c0 >= 0) { d += 'M' + (ox + c0 * modul) + ' ' + (oy + r * modul) + 'h' + ((c - c0) * modul) + 'v' + modul + 'h-' + ((c - c0) * modul) + 'z'; c0 = -1; }
      }
    }
    var info = { modular: n, modul_mm: modul / DPMM, side_mm: side / DPMM, x: ox / DPMM, y: oy / DPMM };
    return { svg: '<path transform="scale(' + (1 / DPMM) + ')" shape-rendering="crispEdges" fill="' + (farge || '#000') + '" d="' + d + '"/>', info: info };
  }

  // Fargar per modus. pre = fast trykk, v = variabelt (alltid svart)
  function palett(modus) {
    if (modus === 'blank') return { botn: '#fff', band: '#000', fjell: '#fff', bandtekst: '#fff', tekst: '#000', tittel: '#000', aksent: '#000', vis: { pre: true, v: true } };
    var p = { botn: FARGE.ramjolk, band: FARGE.fjellbrun, fjell: FARGE.ramjolk, bandtekst: FARGE.ramjolk, tekst: FARGE.fjellbrun, tittel: FARGE.fjellbrun, aksent: FARGE.raud };
    p.vis = { pre: modus !== 'overtrykk', v: modus !== 'trykk' };
    return p;
  }

  function ramme(w, h, innhald, o) {
    var b = o.utfall || 0; // utfallande kant (mm) for trykkfil
    var stil = o.fontCss ? '<style>' + o.fontCss + '</style>' : '';
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + (w + 2 * b) + 'mm" height="' + (h + 2 * b) + 'mm" viewBox="' + (-b) + ' ' + (-b) + ' ' + (w + 2 * b) + ' ' + (h + 2 * b) + '">' + stil + innhald + '</svg>';
  }

  function datoTekst(iso) { if (!iso) return ''; var d = String(iso).split('-'); return d.length === 3 ? d[2] + '.' + d[1] + '.' + d[0] : iso; }
  function kr(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' kr'; }
  function krDes(n) { var t = (Math.round(n * 100) / 100).toFixed(2).split('.'); return t[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ',' + t[1] + ' kr'; }
  function vekt(g) { return (g / 1000).toFixed(3).replace('.', ',') + ' kg'; }

  // Felles linjer om opphav og oppbevaring for storfe
  function opphavLinjer(d) {
    var l = [];
    l.push(d.fryst ? 'Oppbevarast fryst ved −18 °C. Tin i kjøleskap.' : 'Oppbevarast ved 0–4 °C.');
    l.push('Opphav: Noreg' + (d.ref ? ' · Ref.nr. ' + d.ref : ''));
    if (d.kverna) l.push('Slakta: Noreg' + (d.slakteri ? ' (' + d.slakteri + ')' : '') + ' · Kverna: Noreg');
    else {
      l.push('Slakta: Noreg' + (d.slakteri ? ' (' + d.slakteri + ')' : ''));
      l.push('Skore: Noreg' + (d.skjering ? ' (' + d.skjering + ')' : ''));
    }
    return l;
  }
  function datoLinje(d) {
    if (d.fryst) return [['Fryst den\u00a0', datoTekst(d.fryst)], ['\u2003Best før\u00a0', datoTekst(d.bestFor)]];
    return [['Pakka\u00a0', datoTekst(d.pakka)], ['\u2003Best før\u00a0', datoTekst(d.bestFor)]];
  }
  function blanda(x, y, deler, s, farge) {
    // «Fryst den» normal + dato halvfeit på same linje
    var ut = '', cx = x;
    deler.forEach(function (p) {
      ut += tekst(cx, y, p[0], { s: s, v: 400, f: farge }); cx += breidd(p[0], s, SAN, 400);
      ut += tekst(cx, y, p[1], { s: s, v: 600, f: farge }); cx += breidd(p[1], s, SAN, 600);
    });
    return ut;
  }

  // ---------- Kjøt, 100 × 70 mm ----------
  // d: { namn, g, kgPris, kr, fryst, bestFor, pakka, ref, slakteri, skjering, kverna, kode }
  function kjot(d, o) {
    o = o || {}; var P = palett(o.modus || 'blank'), W = 100, H = 70, s = '';
    var bandH = 16.5, fjW = 60;
    if (P.vis.pre) {
      if (o.modus !== 'blank') s += rekt(-3, -3, W + 6, H + 6, P.botn);
      s += rekt(-3, -3, W + 6, bandH + 3, P.band);
      s += fjell(W - fjW, bandH - fjellH(fjW), fjW, P.fjell) + fjellUtfall(W - fjW, bandH - fjellH(fjW), fjW, P.fjell, o.utfall);
      s += tekst(4, 8.2, 'Fredheim', { d: true, v: 600, s: 4.7, f: P.bandtekst });
      s += tekst(4, 11.6, 'GARD · EIDSÅ', { v: 600, s: 1.9, sp: 0.24, f: P.bandtekst });
      s += tekst(4, 21.8, 'STORFE FRÅ FREDHEIM GARD', { v: 600, s: 2.0, sp: 0.18, f: P.tekst });
      s += tekst(4, 35.3, 'Å BETALE', { v: 600, s: 1.9, sp: 0.14, f: P.tekst });
      s += tekst(29, 35.3, 'NETTOVEKT', { v: 600, s: 1.9, sp: 0.14, f: P.tekst });
      s += tekst(46, 35.3, 'KILOPRIS', { v: 600, s: 1.9, sp: 0.14, f: P.tekst });
      s += linje(4, 44.4, 66, 44.4, 0.3, P.aksent);
      s += tekst(96.4, 37.4, 'SKANN FOR Å KJØPE', { v: 600, s: 1.8, sp: 0.12, a: 'end', f: P.tekst });
      s += tekst(4, 67.4, ADR.namn + ' · ' + ADR.veg + ' · ' + ADR.post, { s: 2.35, f: P.tekst, maks: 62 });
    }
    var info = null;
    if (P.vis.v) {
      s += tekst(4, 30.2, d.namn, { d: true, v: 600, s: 7.8, maks: 92 });
      s += tekst(4, 41.8, kr(d.kr), { d: true, v: 600, s: 6.0, maks: 23.5 });
      s += tekst(29, 41.4, vekt(d.g), { v: 600, s: 3.1, maks: 16 });
      s += tekst(46, 41.4, krDes(d.kgPris) + '/kg', { s: 2.8, maks: 21 });
      s += blanda(4, 49.6, datoLinje(d), 2.75, '#000');
      var l = opphavLinjer(d), y = 54.4;
      l.forEach(function (t) { s += tekst(4, y, t, { s: 2.5, maks: 63 }); y += 3.25; });
      var q = qr(d.kode, [560, 323, 214], 5); s += q.svg; info = q.info;
    }
    return { w: W, h: H, svg: ramme(W, H, s, o), qr: info };
  }

  // ---------- Kjøtkasse, 100 × 150 mm ----------
  // d: som kjot + { tekst, innhald: [..] }
  function kasse(d, o) {
    o = o || {}; var P = palett(o.modus || 'blank'), W = 100, H = 150, s = '';
    var bandH = 30, fjW = 100;
    if (P.vis.pre) {
      if (o.modus !== 'blank') s += rekt(-3, -3, W + 6, H + 6, P.botn);
      s += rekt(-3, -3, W + 6, bandH + 3, P.band);
      s += fjell(0, bandH - fjellH(fjW), fjW + 0.2, P.fjell) + fjellUtfall(0, bandH - fjellH(fjW), fjW + 0.2, P.fjell, o.utfall);
      s += tekst(4, 7.4, 'FREDHEIM GARD · EIDSÅ', { v: 600, s: 2.2, sp: 0.24, f: P.bandtekst });
      s += tekst(4, 38.6, 'KJØTKASSE · STORFE FRÅ GARDEN', { v: 600, s: 2.2, sp: 0.18, f: P.tekst });
      s += tekst(4, 92.4, 'Å BETALE', { v: 600, s: 2.1, sp: 0.14, f: P.tekst });
      s += tekst(36, 92.4, 'NETTOVEKT', { v: 600, s: 2.1, sp: 0.14, f: P.tekst });
      s += tekst(62, 92.4, 'KILOPRIS', { v: 600, s: 2.1, sp: 0.14, f: P.tekst });
      s += linje(4, 104.6, 96, 104.6, 0.3, P.aksent);
      s += tekst(96.2, 111.6, 'SKANN FOR Å KJØPE', { v: 600, s: 2.0, sp: 0.12, a: 'end', f: P.tekst });
      s += tekst(4, 141.2, ADR.namn, { s: 2.6, v: 600, f: P.tekst });
      s += tekst(4, 145.0, ADR.veg + ', ' + ADR.post, { s: 2.6, f: P.tekst });
    }
    var info = null;
    if (P.vis.v) {
      s += tekst(4, 48.5, d.namn, { d: true, v: 600, s: 9.5, maks: 92 });
      if (d.tekst) s += tekst(4, 54.8, d.tekst, { s: 3.0, maks: 92 });
      var inn = (d.innhald || []).slice(0, 7), y = 61.6;
      if (inn.length) { s += tekst(4, y, 'Innhald:', { s: 2.8, v: 600 }); y += 3.8; inn.forEach(function (t) { s += tekst(4, y, '– ' + t, { s: 2.8, maks: 90 }); y += 3.5; }); }
      s += tekst(4, 100.6, kr(d.kr), { d: true, v: 600, s: 7.4, maks: 30 });
      s += tekst(36, 100.0, vekt(d.g), { v: 600, s: 3.6, maks: 24 });
      s += tekst(62, 100.0, krDes(d.kgPris) + '/kg', { s: 3.2, maks: 34 });
      s += blanda(4, 111.6, datoLinje(d), 2.9, '#000');
      var l = opphavLinjer(d); y = 117.6;
      l.forEach(function (t) { s += tekst(4, y, t, { s: 2.6, maks: 56 }); y += 3.6; });
      var q = qr(d.kode, [512, 912, 256], 6); s += q.svg; info = q.info;
    }
    return { w: W, h: H, svg: ramme(W, H, s, o), qr: info };
  }

  // ---------- Mjølkeflaske, 80 × 100 mm ----------
  // d: { tappa, bestFor, pris, kode, fett }
  function mjolk(d, o) {
    o = o || {}; var P = palett(o.modus || 'blank'), W = 80, H = 100, s = '';
    var bandH = 28, fjW = 80;
    if (P.vis.pre) {
      if (o.modus !== 'blank') s += rekt(-3, -3, W + 6, H + 6, P.botn);
      s += rekt(-3, -3, W + 6, bandH + 3, P.band);
      s += fjell(0, bandH - fjellH(fjW), fjW + 0.2, P.fjell) + fjellUtfall(0, bandH - fjellH(fjW), fjW + 0.2, P.fjell, o.utfall);
      s += tekst(4, 6.6, 'FREDHEIM GARD · EIDSÅ', { v: 600, s: 2.1, sp: 0.24, f: P.bandtekst });
      s += tekst(4, 40.5, 'Heilmelk', { d: true, v: 600, s: 11, f: P.tittel });
      s += tekst(4, 46.4, 'PASTEURISERT · IKKJE HOMOGENISERT', { v: 600, s: 2.3, sp: 0.12, f: P.tekst, maks: 72 });
      s += tekst(4, 53.6, '1 liter', { d: true, v: 600, s: 5.2, f: P.tittel });
      s += linje(4, 57.6, 76, 57.6, 0.3, P.aksent);
      s += tekst(76.4, 67.4, 'SKANN FOR Å KJØPE', { v: 600, s: 1.8, sp: 0.12, a: 'end', f: P.tekst });
      s += tekst(4, 76.2, 'Oppbevarast ved 0–4 °C.', { s: 2.5, f: P.tekst });
      s += tekst(4, 79.8, 'Byt tom flaske mot full.', { s: 2.5, f: P.tekst });
      s += tekst(4, 86.6, ADR.namn, { s: 2.5, v: 600, f: P.tekst });
      s += tekst(4, 90.2, ADR.veg, { s: 2.5, f: P.tekst });
      s += tekst(4, 93.8, ADR.post, { s: 2.5, f: P.tekst });
    }
    var info = null;
    if (P.vis.v) {
      s += tekst(76, 53.6, kr(d.pris), { d: true, v: 600, s: 5.2, a: 'end' });
      s += tekst(76, 40.5, krDes(d.pris) + '/l', { s: 2.3, a: 'end' });
      s += blanda(4, 64.4, [['Tappa\u00a0', datoTekst(d.tappa)]], 2.8, '#000');
      s += blanda(4, 68.6, [['Best før\u00a0', datoTekst(d.bestFor)]], 2.8, '#000');
      var q = qr(d.kode, [410, 568, 206], 6); s += q.svg; info = q.info;
    }
    return { w: W, h: H, svg: ramme(W, H, s, o), qr: info };
  }

  // ---------- Egg, 63,5 × 38,1 mm (A4-ark, 21 stk, vanleg skrivar i farge) ----------
  // d: { tal, pris, bestFor, minVekt, kode }
  function egg(d, o) {
    o = o || {}; var W = 63.5, H = 38.1, s = '', b = FARGE.fjellbrun;
    s += fjell(3.4, 2.6, 17, b);
    s += tekst(3.4, 14.6, 'Egg', { d: true, v: 600, s: 7.2, f: b });
    s += tekst(18.4, 14.6, d.tal + ' stk', { v: 600, s: 2.7, f: b });
    s += blanda(3.4, 19.0, [['Best før\u00a0', datoTekst(d.bestFor)]], 2.5, b);
    s += tekst(3.4, 22.5, 'Oppbevarast kjøleg.', { s: 2.4, f: b });
    s += tekst(3.4, 26.0, d.minVekt ? 'Ulik storleik, minst ' + d.minVekt + ' g' : 'Frå eigne høner', { s: 2.4, f: b, maks: 34 });
    s += tekst(3.4, 30.4, ADR.namn, { s: 2.4, v: 600, f: b });
    s += tekst(3.4, 33.8, ADR.veg + ', ' + ADR.post, { s: 2.4, f: b, maks: 34 });
    s += tekst(60.1, 7.6, kr(d.pris), { d: true, v: 600, s: 4.3, a: 'end', f: b });
    s += tekst(60.1, 10.9, krDes(d.pris / d.tal) + '/stk', { s: 2.0, a: 'end', f: b });
    // QR: 0,6 mm modular. Teikna i «punkt» på 8/mm som dei andre (0,625 mm = 5 punkt).
    var q = qr(d.kode, [322, 112, 165], 5); s += q.svg;
    return { w: W, h: H, svg: ramme(W, H, s, o), qr: q.info };
  }

  // ---------- Rasterisering og ZPL ----------
  // SVG → 1-bits canvas på skrivaroppløysinga (8 punkt/mm)
  function teikn(svg, wMm, hMm, dpmm) {
    dpmm = dpmm || DPMM;
    return new Promise(function (ok, feil) {
      var img = new Image(), url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
      img.onload = function () {
        var c = document.createElement('canvas'); c.width = Math.round(wMm * dpmm); c.height = Math.round(hMm * dpmm);
        var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
        var id = x.getImageData(0, 0, c.width, c.height), p = id.data;
        for (var i = 0; i < p.length; i += 4) { var v = (p[i] * 0.299 + p[i + 1] * 0.587 + p[i + 2] * 0.114) < 128 ? 0 : 255; p[i] = p[i + 1] = p[i + 2] = v; p[i + 3] = 255; }
        x.putImageData(id, 0, 0); URL.revokeObjectURL(url); ok(c);
      };
      img.onerror = function (e) { URL.revokeObjectURL(url); feil(e); };
      img.src = url;
    });
  }
  // 1-bits canvas → ZPL (^GFA). kopiar = tal på utskrifter.
  function zpl(c, kopiar) {
    var x = c.getContext('2d'), w = c.width, h = c.height, p = x.getImageData(0, 0, w, h).data;
    var bpr = Math.ceil(w / 8), hex = [], HEX = '0123456789ABCDEF';
    for (var y = 0; y < h; y++) {
      for (var b = 0; b < bpr; b++) {
        var v = 0;
        for (var k = 0; k < 8; k++) { var xx = b * 8 + k; if (xx < w && p[(y * w + xx) * 4] < 128) v |= 128 >> k; }
        hex.push(HEX[v >> 4] + HEX[v & 15]);
      }
    }
    var n = bpr * h;
    return '^XA^MTT^MNY^PW' + w + '^LL' + h + '^LH0,0^CI28\n^FO0,0^GFA,' + n + ',' + n + ',' + bpr + ',' + hex.join('') + '^FS\n^PQ' + (kopiar || 1) + '^XZ\n';
  }

  // Skrifter som data-URI, slik at SVG-en kan teiknast i canvas (Image) med rette skrifter.
  function lastFontCss(sti) {
    sti = sti || 'fonts/';
    var filer = [['Fraunces', 400, 'fraunces-latin-400-normal.woff2'], ['Fraunces', 600, 'fraunces-latin-600-normal.woff2'],
      ['Instrument Sans', 400, 'instrument-sans-latin-400-normal.woff2'], ['Instrument Sans', 600, 'instrument-sans-latin-600-normal.woff2']];
    return Promise.all(filer.map(function (fi) {
      return fetch(sti + fi[2]).then(function (r) { return r.arrayBuffer(); }).then(function (buf) {
        var u = new Uint8Array(buf), bin = ''; for (var i = 0; i < u.length; i += 0x8000) bin += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
        return "@font-face{font-family:'" + fi[0] + "';font-weight:" + fi[1] + ";src:url(data:font/woff2;base64," + btoa(bin) + ") format('woff2')}";
      });
    })).then(function (l) {
      var css = l.join('');
      var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
      return document.fonts.ready.then(function () {
        return Promise.all([document.fonts.load('600 10px Fraunces'), document.fonts.load('400 10px Fraunces'), document.fonts.load("400 10px 'Instrument Sans'"), document.fonts.load("600 10px 'Instrument Sans'")]);
      }).then(function () { return css; });
    });
  }

  // ---------- Kode (F1-format frå OVERLEVERING.md) ----------
  function sjekk(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 1296; return h.toString(36); }
  function pakkeKode(base, p) {
    // p: { id, produkt, g, kr, dato (DDMMÅÅ), parti }. Punktum er skiljeteikn og kan ikkje stå i felta.
    var felt = ['F1', p.id, p.produkt, Math.round(p.g), Math.round(p.kr), p.dato, p.parti];
    felt.forEach(function (v) { if (/[.\s#]/.test(String(v))) throw new Error('Ugyldig teikn i kodefelt: ' + v); });
    var s = felt.join('.');
    return base + '#v=' + s + '.' + sjekk(s);
  }
  function hylleKode(base, produkt) { var s = 'F1.H.' + produkt; return base + '#v=' + s + '.' + sjekk(s); }
  function ddmmaa(iso) { var d = String(iso).split('-'); return d[2] + d[1] + d[0].slice(2); }

  window.FH_ETIKETT = { kjot: kjot, kasse: kasse, mjolk: mjolk, egg: egg, teikn: teikn, zpl: zpl, lastFontCss: lastFontCss,
    pakkeKode: pakkeKode, hylleKode: hylleKode, ddmmaa: ddmmaa, DPMM: DPMM, FARGE: FARGE, kr: kr, krDes: krDes, vekt: vekt };
})();
