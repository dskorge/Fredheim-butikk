(function () {
  'use strict';

  // ---------- Prisar (frå gardsbutikk-analysen og kjøtkasse-sida) ----------
  var MVA = 15;   // matvarer
  var FLASKE = 20; // glasflaske: kjøpt éin gong, deretter byte tom mot full (ikkje pant, ingen kontantar tilbake, 15 % mva)
  var PROD = {
    deig:      { namn: 'Kjøtdeig',       kg: 219,  vekt: true,  tekst: 'Storfe frå garden, laus vekt' },
    familie:   { namn: 'Familiekasse',   pris: 2890, tekst: 'ca. 10 kg, blanda stykningsdelar' },
    halv:      { namn: 'Halv kasse',     pris: 1490, tekst: 'Halv familiekasse' },
    deigpakke: { namn: 'Kjøtdeigpakke',  pris: 1090, tekst: '5 kg · 218 kr/kg' },
    helg:      { namn: 'Helgepakke',     pris: 990,  tekst: 'ca. 2 kg · biff, entrecôte, ytrefilet' },
    egg12:     { namn: 'Egg, 12 stk',    pris: 65,   tekst: 'Frå eigne høner' },
    egg30:     { namn: 'Egg, brett 30',  pris: 150,  tekst: 'Frå eigne høner' },
    mjolk:     { namn: 'Heilmelk 1 l',   pris: 45,   tekst: 'Pasteurisert, tappa på garden', pant: true },
    // Stykningsdelar (laus vekt). Kiloprisen blir sett på etikettskrivaren og ligg i koden (kr), så kg er null her.
    morbrad:   { namn: 'Mørbrad',        kg: null, vekt: true, tekst: 'Storfe frå garden' },
    ytrefilet: { namn: 'Ytrefilet',      kg: null, vekt: true, tekst: 'Storfe frå garden' },
    entrecote: { namn: 'Entrecôte',      kg: null, vekt: true, tekst: 'Storfe frå garden' },
    flatbiff:  { namn: 'Flatbiff',       kg: null, vekt: true, tekst: 'Storfe frå garden' },
    rundstek:  { namn: 'Rundstek',       kg: null, vekt: true, tekst: 'Storfe frå garden' },
    hogrygg:   { namn: 'Høgrygg',        kg: null, vekt: true, tekst: 'Storfe frå garden' },
    bogstek:   { namn: 'Bogstek',        kg: null, vekt: true, tekst: 'Storfe frå garden' },
    grytekjot: { namn: 'Grytekjøt',      kg: null, vekt: true, tekst: 'Storfe frå garden' },
    karbonade: { namn: 'Karbonadedeig',  kg: null, vekt: true, tekst: 'Storfe frå garden' },
    suppekjot: { namn: 'Suppekjøt',      kg: null, vekt: true, tekst: 'Storfe frå garden' }
  };
  // Kilopris frå PROD. For stykningsdelar står kiloprisen berre på etiketten (koden har vekt og pris, ikkje kilopris).
  function kgPris(p) { return p.kg != null ? p.kg : null; }
  var HYLLE = ['egg12', 'egg30', 'mjolk'];
  // Demo-pakkar (det vekta og etikettskrivaren lagar i den ferdige løysinga)
  var PAKKAR = [
    { id: 'P1001', p: 'deig', g: 512 },
    { id: 'P1002', p: 'deig', g: 498 },
    { id: 'P1003', p: 'deig', g: 1006 },
    { id: 'P2001', p: 'familie', g: 0 },
    { id: 'P2002', p: 'halv', g: 0 },
    { id: 'P2003', p: 'deigpakke', g: 0 },
    { id: 'P2004', p: 'helg', g: 0 }
  ];
  var PAKKA = '181126', BESTFOR = '241126', PARTI = 'B2611';

  // ---------- Kode: F1.<pakke>.<produkt>.<gram>.<kr>.<dato>.<parti>.<sjekk> ----------
  // Prototype: enkel sjekksum. I den ferdige løysinga signerer Huben koden (HMAC) og sjekkar på serveren.
  function sjekk(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 1296; return h.toString(36); }
  function pris(p, g) { return p.vekt ? Math.round(p.kg * g / 1000) : p.pris; }
  function lagKode(pk) {
    var p = PROD[pk.p];
    var s = ['F1', pk.id, pk.p, pk.g, pris(p, pk.g), PAKKA, PARTI].join('.');
    return s + '.' + sjekk(s);
  }
  function hylleKode(pid) { var s = 'F1.H.' + pid; return s + '.' + sjekk(s); }
  function base() { return location.href.split('#')[0]; }
  function url(kode) { return base() + '#v=' + encodeURIComponent(kode); }

  function lesKode(txt) {
    if (!txt) return null;
    var m = txt.match(/#v=([^&]+)/); if (m) txt = decodeURIComponent(m[1]);
    var d = txt.split('.'); if (d[0] !== 'F1') return null;
    var sig = d.pop(); if (sjekk(d.join('.')) !== sig) return { feil: 'Ukjend eller endra kode' };
    if (d[1] === 'H') { var hp = PROD[d[2]]; if (!hp) return null; return { hylle: true, pid: d[2], namn: hp.namn, kr: hp.pris, pant: !!hp.pant }; }
    var p = PROD[d[2]]; if (!p) return null;
    return { id: d[1], pid: d[2], namn: p.namn, g: +d[3], kr: +d[4], kg: kgPris(p), vekt: !!p.vekt, tekst: p.tekst, dato: d[5], parti: d[6] };
  }

  // ---------- Lagring ----------
  var mem = {};
  function hent(k, def) { try { var v = localStorage.getItem('fh_' + k); return v ? JSON.parse(v) : def; } catch (e) { return k in mem ? mem[k] : def; } }
  function lagre(k, v) { mem[k] = v; try { localStorage.setItem('fh_' + k, JSON.stringify(v)); } catch (e) {} }
  var korg = hent('korg2', []);
  var seld = hent('seld2', []);
  function lagreKorg() { lagre('korg2', korg); }

  // ---------- Hjelparar ----------
  function kr(n) { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' kr'; }
  function krDes(n) { var t = Number.isInteger(n) ? String(n) : n.toFixed(2); var d = t.split('.'); return d[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (d[1] ? ',' + d[1] : '') + ' kr'; }
  function vekt(g) { return (g / 1000).toFixed(3).replace('.', ',') + ' kg'; }
  function dato(d) { return d.slice(0, 2) + '.' + d.slice(2, 4) + '.20' + d.slice(4); }
  function $(s) { return document.querySelector(s); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function sum() { return korg.reduce(function (t, l) { return t + l.kr * (l.n || 1); }, 0); }
    function mva() { return Math.round(sum() * MVA / (100 + MVA)); }
  function antal() { return korg.reduce(function (t, l) { return l.pantLinje ? t : t + (l.n || 1); }, 0); }
  function varer(n) { return n + (n === 1 ? ' vare' : ' varer'); }

  var toastT;
  function toast(html, feil) {
    var t = $('#toast'); t.innerHTML = html; t.className = 'on' + (feil ? ' feil' : '');
    clearTimeout(toastT); toastT = setTimeout(function () { t.className = ''; }, 2600);
  }

  // ---------- Legg til ----------
  function auk(match, ny) {
    var l = korg.find(match);
    if (l) l.n++; else korg.push(ny);
  }
  function pantLinje(delta) {
    var l = korg.find(function (x) { return x.pantLinje; });
    if (!l && delta > 0) korg.push({ pantLinje: true, namn: 'Glasflaske', kr: FLASKE, n: delta });
    else if (l) { l.n += delta; if (l.n <= 0) korg.splice(korg.indexOf(l), 1); }
  }
  var ventarPaPant = false;
  function leggTil(txt) {
    if (ventarPaPant) return false;
    var v = lesKode(txt);
    if (!v) { toast('Kjenner ikkje att denne koden.', true); return false; }
    if (v.feil) { toast(v.feil + '.', true); return false; }
    if (v.hylle && v.pant) { ventarPaPant = true; $('#pantDlg').showModal(); return true; }
    if (v.hylle) {
      auk(function (x) { return x.hylle && x.pid === v.pid; }, { hylle: true, pid: v.pid, namn: v.namn, kr: v.kr, n: 1 });
    } else {
      if (seld.indexOf(v.id) >= 0) { toast('Denne pakken er alt seld. Ta kontakt med oss.', true); return false; }
      if (korg.some(function (x) { return x.id === v.id; })) { toast(esc(v.namn) + ' ligg alt i korga.'); return false; }
      korg.push({ id: v.id, pid: v.pid, namn: v.namn, g: v.g, kg: v.kg, vekt: v.vekt, tekst: v.tekst, kr: v.kr, dato: v.dato, parti: v.parti });
    }
    lagtTil(v.namn + (v.vekt ? ' ' + vekt(v.g) : ''));
    return true;
  }
  function lagtTil(tekst) {
    lagreKorg();
    if (navigator.vibrate) try { navigator.vibrate(40); } catch (e) {}
    toast('<b>' + esc(tekst) + '</b> lagt i korga · ' + varer(antal()) + ' · ' + kr(sum()));
    teikn();
  }
  function mjolk(medPant) {
    var p = PROD.mjolk;
    auk(function (x) { return x.hylle && x.pid === 'mjolk'; }, { hylle: true, pid: 'mjolk', namn: p.namn, kr: p.pris, n: 1 });
    if (medPant) pantLinje(1);
    $('#pantDlg').close(); ventarPaPant = false;
    lagtTil(p.namn + (medPant ? ' + ny flaske' : ', byte flaske'));
  }

  // ---------- Visning ----------
  function vis(id) {
    ['#korg', '#takk', '#etikettar'].forEach(function (s) { $(s).hidden = s !== id; });
    document.body.dataset.vis = id.slice(1);
    window.scrollTo(0, 0);
  }

  function linjeMeta(l) {
    if (l.pantLinje) return kr(l.kr) + ' per flaske · neste gong byter du tom mot full';
    if (l.hylle) return kr(l.kr) + ' per stk';
    if (l.vekt) return vekt(l.g) + (l.kg != null ? ' · ' + krDes(l.kg) + '/kg' : '');
    return esc(l.tekst || '');
  }
  function teikn() {
    var tom = korg.length === 0;
    $('#tom').hidden = !tom; $('#fylt').hidden = tom;
    $('#botn').hidden = tom;
    if (tom) return;
    $('#linjer').innerHTML = korg.map(function (l, i) {
      var ctrl = (l.hylle || l.pantLinje)
        ? '<div class="tal"><button data-minus="' + i + '" aria-label="Ein færre">−</button><span>' + l.n + '</span><button data-pluss="' + i + '" aria-label="Ein til">+</button></div>'
        : '<button class="fjern" data-fjern="' + i + '">Fjern</button>';
      return '<li' + (l.pantLinje ? ' class="pant"' : '') + '><div><b>' + esc(l.namn) + '</b><small>' + linjeMeta(l) + '</small>' + ctrl + '</div><span class="pris">' + kr(l.kr * (l.n || 1)) + '</span></li>';
    }).join('');
    var s = sum();
    $('#sum').textContent = kr(s);
    $('#mva').textContent = 'Herav mva. ' + MVA + ' %: ' + kr(mva());
    $('#betal').textContent = 'Betal ' + kr(s) + ' med Vipps';
    $('#tal').textContent = varer(antal());
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('button,a'); if (!t) return;
    var d = t.dataset;
    if (d.fjern != null) { korg.splice(+d.fjern, 1); lagreKorg(); teikn(); }
    else if (d.pluss != null) { var lp = korg[+d.pluss]; if (lp.pid === 'mjolk') { leggTil(hylleKode('mjolk')); } else { lp.n++; lagreKorg(); teikn(); } }
    else if (d.minus != null) {
      var l = korg[+d.minus];
      if (--l.n <= 0) korg.splice(+d.minus, 1);
      if (l.pid === 'mjolk') { var pl = korg.find(function (x) { return x.pantLinje; }); var mj = l.n > 0 ? l.n : 0; if (pl && pl.n > mj) pantLinje(mj - pl.n); }
      lagreKorg(); teikn();
    }
    else if (d.test != null) { lukkTest(); leggTil(d.test); }
    else if (t.id === 'medPant') mjolk(true);
    else if (t.id === 'utanPant') mjolk(false);
    else if (t.id === 'skann' || t.id === 'skann2') opneSkannar();
    else if (t.id === 'ferdig') lukkSkannar();
    else if (t.id === 'betal') $('#vipps').showModal();
    else if (t.id === 'godkjenn') { $('#vipps').close(); fullfoer(); }
    else if (t.id === 'avbryt') $('#vipps').close();
    else if (t.id === 'opneTest' || t.id === 'opneTest2') $('#testvarer').showModal();
    else if (t.id === 'lukkTest') lukkTest();
    else if (t.id === 'skriv') { try { window.print(); } catch (err) {} }
    else if (t.id === 'nyHandel') { history.replaceState(null, '', base()); vis('#korg'); }
    else if (t.id === 'nullstill') { korg = []; seld = []; lagreKorg(); lagre('seld2', seld); teikn(); toast('Testdata nullstilt.'); }
  });
  $('#pantDlg').addEventListener('cancel', function (e) { e.preventDefault(); });
  function lukkTest() { var dl = $('#testvarer'); if (dl.open) dl.close(); }

  // ---------- Betaling (simulert) ----------
  function fullfoer() {
    var s = sum(), nr = 'FH-' + Date.now().toString().slice(-6);
    korg.forEach(function (l) { if (l.id) seld.push(l.id); });
    $('#ordre').textContent = 'Ordre ' + nr + ' · ' + new Date().toLocaleString('nb-NO', { dateStyle: 'short', timeStyle: 'short' });
    $('#kvlinjer').innerHTML = korg.map(function (l) {
      var under = l.pantLinje ? '<small>Ta med flaska neste gong og byt ho mot ei full</small>'
        : l.vekt ? '<small>' + vekt(l.g) + ' · parti ' + esc(l.parti) + '</small>'
        : l.id ? '<small>Parti ' + esc(l.parti) + '</small>' : '';
      return '<tr><td>' + esc(l.namn) + ((l.hylle || l.pantLinje) ? ' × ' + l.n : '') + under + '</td><td>' + kr(l.kr * (l.n || 1)) + '</td></tr>';
    }).join('');
    $('#kvsum').textContent = kr(s);
    $('#kvmva').textContent = kr(mva());
    korg = []; lagreKorg(); lagre('seld2', seld); teikn();
    vis('#takk');
  }

  // ---------- Skannar ----------
  // Les kodar på 20–40 cm: be om HD-video, les eit utsnitt rundt ramma i full oppløysing
  // (og annankvar gong heile biletet nedskalert). Brukar BarcodeDetector der nettlesaren har det.
  var straum = null, loop = null, sist = {}, rundar = 0, detektor = null;
  function treff(data) {
    var now = Date.now();
    if (sist[data] && now - sist[data] < 2500) return;
    sist[data] = now;
    var ok = leggTil(data);
    var ram = $('#ram'); ram.className = ok ? 'ok' : 'nei'; setTimeout(function () { ram.className = ''; }, 600);
  }
  function rammeUtsnitt(v) {
    // Kvar ramma ligg i videobiletet (video er object-fit: cover over heile skjermen).
    var vw = v.videoWidth, vh = v.videoHeight, sw = window.innerWidth, sh = window.innerHeight;
    var s = Math.max(sw / vw, sh / vh), ox = (vw * s - sw) / 2, oy = (vh * s - sh) / 2;
    var r = $('#ram').getBoundingClientRect();
    var pad = r.width * 0.35; // litt rom utanfor ramma
    var x = (r.left - pad + ox) / s, y = (r.top - pad + oy) / s, w = (r.width + 2 * pad) / s;
    x = Math.max(0, Math.min(x, vw - w)); y = Math.max(0, Math.min(y, vh - w));
    return { x: x, y: y, w: Math.min(w, vw, vh) };
  }
  function opneSkannar() {
    $('#skannar').hidden = false; document.body.classList.add('skannar');
    $('#kamfeil').hidden = true;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return kamFeil();
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false }).then(function (s) {
      straum = s; var v = $('#video'); v.srcObject = s; v.setAttribute('playsinline', ''); v.play();
      try { if ('BarcodeDetector' in window) detektor = new window.BarcodeDetector({ formats: ['qr_code'] }); } catch (e) { detektor = null; }
      var c = document.createElement('canvas'), x = c.getContext('2d', { willReadFrequently: true }), opptatt = false;
      loop = setInterval(function () {
        if (v.readyState < 2 || ventarPaPant || opptatt) return;
        rundar++;
        if (detektor) {
          opptatt = true;
          detektor.detect(v).then(function (r) { opptatt = false; if (r && r.length) treff(r[0].rawValue); })
            .catch(function () { opptatt = false; detektor = null; });
          return;
        }
        var w, h;
        if (rundar % 2) { // utsnitt rundt ramma i full oppløysing (maks 800 px)
          var u = rammeUtsnitt(v); w = h = Math.min(800, Math.round(u.w));
          c.width = w; c.height = h; x.drawImage(v, u.x, u.y, u.w, u.w, 0, 0, w, h);
        } else { // heile biletet, nedskalert
          w = 640; h = Math.round(v.videoHeight / v.videoWidth * w) || 480;
          c.width = w; c.height = h; x.drawImage(v, 0, 0, w, h);
        }
        var r = window.jsQR(x.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' });
        if (r && r.data) treff(r.data);
      }, 180);
    }).catch(kamFeil);
  }
  function kamFeil() { $('#kamfeil').hidden = false; }
  function lukkSkannar() {
    clearInterval(loop); loop = null;
    if (straum) { straum.getTracks().forEach(function (t) { t.stop(); }); straum = null; }
    $('#skannar').hidden = true; document.body.classList.remove('skannar');
  }

  // ---------- Etikettar ----------
  function qrSvg(tekst, mod) {
    var q = window.qrcode(0, 'M'); q.addData(tekst); q.make();
    return q.createSvgTag({ cellSize: mod || 3, margin: 0, scalable: true });
  }
  function lagEtikettar() {
    var logo = $('#logo-src').innerHTML;
    var html = PAKKAR.map(function (pk) {
      var p = PROD[pk.p], k = lagKode(pk), pr = pris(p, pk.g);
      var linje = p.vekt ? vekt(pk.g) + ' · ' + kr(p.kg) + '/kg' : esc(p.tekst);
      return '<article class="etikett"><div class="et-topp">' + logo + '<span class="caps">Fredheim gard · Eidså</span></div>' +
        '<h3>' + esc(p.namn) + '</h3><p class="et-tekst">' + (p.vekt ? esc(p.tekst) : 'Skore, vakuumpakka og merkt') + '</p>' +
        '<div class="et-midt"><div><p class="et-pris">' + kr(pr) + '</p><p>' + linje + '</p>' +
        '<p class="et-sm">Pakka ' + dato(PAKKA) + ' · Best før ' + dato(BESTFOR) + '<br>Parti ' + PARTI + ' · Pakke ' + pk.id + '<br>Oppbevarast ved 0–4 °C</p></div>' +
        '<div class="et-qr">' + qrSvg(url(k)) + '<span>Skann for å kjøpe</span></div></div></article>';
    }).join('');
    html += HYLLE.map(function (pid) {
      var p = PROD[pid];
      var info = p.pant ? 'Har du med tom flaske, byter du. Ny flaske: + ' + kr(FLASKE) + '.' : 'Skann éin gong per vare du tek';
      return '<article class="etikett hylle"><div class="et-topp">' + logo + '<span class="caps">Hyllekode</span></div>' +
        '<h3>' + esc(p.namn) + '</h3><p class="et-tekst">' + esc(p.tekst) + '</p>' +
        '<div class="et-midt"><div><p class="et-pris">' + kr(p.pris) + '</p><p>' + info + '</p></div>' +
        '<div class="et-qr">' + qrSvg(url(hylleKode(pid))) + '<span>Skann for å kjøpe</span></div></div></article>';
    }).join('');
    $('#ark').innerHTML = html;
    $('#doer-qr').innerHTML = qrSvg(base(), 6);
    $('#testliste').innerHTML = PAKKAR.map(function (pk) {
      var p = PROD[pk.p];
      return '<li><button class="btn" data-test="' + esc(lagKode(pk)) + '">' + esc(p.namn) + (p.vekt ? ' ' + vekt(pk.g) : '') + '<span>' + kr(pris(p, pk.g)) + '</span></button></li>';
    }).join('') + HYLLE.map(function (pid) {
      return '<li><button class="btn" data-test="' + esc(hylleKode(pid)) + '">' + esc(PROD[pid].namn) + '<span>' + kr(PROD[pid].pris) + '</span></button></li>';
    }).join('');
  }

  // ---------- Ruting ----------
  function ruting() {
    var h = location.hash;
    if (h.indexOf('#v=') === 0) {
      history.replaceState(null, '', base()); vis('#korg'); leggTil(h); return;
    }
    if (h === '#etikettar') vis('#etikettar'); else vis('#korg');
  }
  window.addEventListener('hashchange', ruting);

  $('#pantTekst').textContent = 'Set att den tomme flaska og ta ei full. Utan flaske kjøper du ei ny for ' + kr(FLASKE) + ', som du byter inn neste gong.';
  $('#medPant').textContent = 'Nei, kjøp flaske (+ ' + kr(FLASKE) + ')';
  lagEtikettar();
  teikn();
  ruting();
})();
