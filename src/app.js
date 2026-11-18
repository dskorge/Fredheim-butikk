(function () {
  'use strict';

  // ---------- Data (prototype) ----------
  var MVA = 15; // matvarer
  var PROD = {
    deig:      { namn: 'Kjøtdeig',     kg: 218, vekt: true,  tekst: 'Storfe, 14 % feitt' },
    entrecote: { namn: 'Entrecôte',    kg: 549, vekt: true,  tekst: 'Mørna 14 dagar' },
    biff:      { namn: 'Biff',         kg: 449, vekt: true,  tekst: 'Av ytrefilet' },
    gryte:     { namn: 'Grytekjøt',    kg: 289, vekt: true,  tekst: 'I terningar' },
    egg:       { namn: 'Egg, 12 stk',  pris: 65, vekt: false, tekst: 'Frå eigne høner' },
    mjolk:     { namn: 'Heilmjølk 1 l', pris: 35, vekt: false, tekst: 'Pasteurisert, tappa på garden' }
  };
  // Demo-pakkar (det vekta og etikettskrivaren lagar i den ferdige løysinga)
  var PAKKAR = [
    { id: 'P1001', p: 'deig', g: 512 },
    { id: 'P1002', p: 'deig', g: 498 },
    { id: 'P1003', p: 'entrecote', g: 386 },
    { id: 'P1004', p: 'biff', g: 604 },
    { id: 'P1005', p: 'gryte', g: 812 }
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
    if (d[1] === 'H') { var hp = PROD[d[2]]; if (!hp) return null; return { hylle: true, pid: d[2], namn: hp.namn, kr: hp.pris, tekst: hp.tekst }; }
    var p = PROD[d[2]]; if (!p) return null;
    return { id: d[1], pid: d[2], namn: p.namn, g: +d[3], kr: +d[4], kg: p.kg, dato: d[5], parti: d[6], tekst: p.tekst };
  }

  // ---------- Lagring ----------
  var mem = {};
  function hent(k, def) { try { var v = localStorage.getItem('fh_' + k); return v ? JSON.parse(v) : def; } catch (e) { return k in mem ? mem[k] : def; } }
  function lagre(k, v) { mem[k] = v; try { localStorage.setItem('fh_' + k, JSON.stringify(v)); } catch (e) {} }
  var korg = hent('korg', []);
  var seld = hent('seld', []);

  // ---------- Hjelparar ----------
  function kr(n) { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' kr'; }
  function vekt(g) { return (g / 1000).toFixed(3).replace('.', ',') + ' kg'; }
  function dato(d) { return d.slice(0, 2) + '.' + d.slice(2, 4) + '.20' + d.slice(4); }
  function $(s) { return document.querySelector(s); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function sum() { return korg.reduce(function (t, l) { return t + l.kr * (l.n || 1); }, 0); }
  function antal() { return korg.reduce(function (t, l) { return t + (l.n || 1); }, 0); }

  var toastT;
  function toast(html, feil) {
    var t = $('#toast'); t.innerHTML = html; t.className = 'on' + (feil ? ' feil' : '');
    clearTimeout(toastT); toastT = setTimeout(function () { t.className = ''; }, 2600);
  }

  // ---------- Legg til ----------
  function leggTil(txt) {
    var v = lesKode(txt);
    if (!v) { toast('Kjenner ikkje att denne koden.', true); return false; }
    if (v.feil) { toast(v.feil + '.', true); return false; }
    if (v.hylle) {
      var l = korg.find(function (x) { return x.hylle && x.pid === v.pid; });
      if (l) l.n++; else korg.push({ hylle: true, pid: v.pid, namn: v.namn, kr: v.kr, n: 1 });
    } else {
      if (seld.indexOf(v.id) >= 0) { toast('Denne pakken er alt seld. Ta kontakt med oss.', true); return false; }
      if (korg.some(function (x) { return x.id === v.id; })) { toast(esc(v.namn) + ' ligg alt i korga.'); return false; }
      korg.push({ id: v.id, pid: v.pid, namn: v.namn, g: v.g, kg: v.kg, kr: v.kr, dato: v.dato, parti: v.parti });
    }
    lagre('korg', korg);
    if (navigator.vibrate) try { navigator.vibrate(40); } catch (e) {}
    toast('<b>' + esc(v.namn) + (v.g ? ' ' + vekt(v.g) : '') + '</b> lagt i korga · ' + antal() + (antal() === 1 ? ' vare · ' : ' varer · ') + kr(sum()));
    teikn();
    return true;
  }

  // ---------- Visning ----------
  function vis(id) {
    ['#korg', '#takk', '#etikettar'].forEach(function (s) { $(s).hidden = s !== id; });
    document.body.dataset.vis = id.slice(1);
    window.scrollTo(0, 0);
  }

  function teikn() {
    var tom = korg.length === 0;
    $('#tom').hidden = !tom; $('#fylt').hidden = tom;
    $('#botn').hidden = tom;
    if (tom) return;
    $('#linjer').innerHTML = korg.map(function (l, i) {
      var meta = l.hylle ? kr(l.kr) + ' per stk' : vekt(l.g) + ' · ' + kr(l.kg) + '/kg';
      var ctrl = l.hylle
        ? '<div class="tal"><button data-minus="' + i + '" aria-label="Ein færre">−</button><span>' + l.n + '</span><button data-pluss="' + i + '" aria-label="Ein til">+</button></div>'
        : '<button class="fjern" data-fjern="' + i + '">Fjern</button>';
      return '<li><div><b>' + esc(l.namn) + '</b><small>' + meta + '</small>' + ctrl + '</div><span class="pris">' + kr(l.kr * (l.n || 1)) + '</span></li>';
    }).join('');
    var s = sum();
    $('#sum').textContent = kr(s);
    $('#mva').textContent = 'Herav mva. ' + MVA + ' %: ' + kr(Math.round(s * MVA / (100 + MVA)));
    $('#betal').textContent = 'Betal ' + kr(s) + ' med Vipps';
    $('#tal').textContent = antal() + (antal() === 1 ? ' vare' : ' varer');
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('button,a'); if (!t) return;
    var d = t.dataset;
    if (d.fjern != null) { korg.splice(+d.fjern, 1); lagre('korg', korg); teikn(); }
    else if (d.pluss != null) { korg[+d.pluss].n++; lagre('korg', korg); teikn(); }
    else if (d.minus != null) { var l = korg[+d.minus]; if (--l.n <= 0) korg.splice(+d.minus, 1); lagre('korg', korg); teikn(); }
    else if (d.test != null) { leggTil(d.test); lukkTest(); }
    else if (t.id === 'skann' || t.id === 'skann2') opneSkannar();
    else if (t.id === 'ferdig') lukkSkannar();
    else if (t.id === 'betal') $('#vipps').showModal();
    else if (t.id === 'godkjenn') { $('#vipps').close(); fullfoer(); }
    else if (t.id === 'avbryt') $('#vipps').close();
    else if (t.id === 'opneTest' || t.id === 'opneTest2') $('#testvarer').showModal();
    else if (t.id === 'lukkTest') lukkTest();
    else if (t.id === 'skriv') { try { window.print(); } catch (e) {} }
    else if (t.id === 'nyHandel') { history.replaceState(null, '', base()); vis('#korg'); }
    else if (t.id === 'nullstill') { korg = []; seld = []; lagre('korg', korg); lagre('seld', seld); teikn(); toast('Testdata nullstilt.'); }
  });
  function lukkTest() { var d = $('#testvarer'); if (d.open) d.close(); }

  // ---------- Betaling (simulert) ----------
  function fullfoer() {
    var s = sum(), nr = 'FH-' + Date.now().toString().slice(-6);
    korg.forEach(function (l) { if (l.id) seld.push(l.id); });
    $('#ordre').textContent = 'Ordre ' + nr + ' · ' + new Date().toLocaleString('nb-NO', { dateStyle: 'short', timeStyle: 'short' });
    $('#kvlinjer').innerHTML = korg.map(function (l) {
      return '<tr><td>' + esc(l.namn) + (l.hylle ? ' × ' + l.n : '<small>' + vekt(l.g) + ' · parti ' + esc(l.parti) + '</small>') + '</td><td>' + kr(l.kr * (l.n || 1)) + '</td></tr>';
    }).join('');
    $('#kvsum').textContent = kr(s);
    $('#kvmva').textContent = kr(Math.round(s * MVA / (100 + MVA)));
    korg = []; lagre('korg', korg); lagre('seld', seld); teikn();
    vis('#takk');
  }

  // ---------- Skannar ----------
  var straum = null, loop = null, sist = {};
  function opneSkannar() {
    var o = $('#skannar'); o.hidden = false; document.body.classList.add('skannar');
    $('#kamfeil').hidden = true;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return kamFeil();
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }).then(function (s) {
      straum = s; var v = $('#video'); v.srcObject = s; v.setAttribute('playsinline', ''); v.play();
      var c = document.createElement('canvas'), x = c.getContext('2d', { willReadFrequently: true });
      loop = setInterval(function () {
        if (v.readyState < 2) return;
        var w = 480, h = Math.round(v.videoHeight / v.videoWidth * w) || 360;
        c.width = w; c.height = h; x.drawImage(v, 0, 0, w, h);
        var r = window.jsQR(x.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' });
        if (r && r.data) {
          var now = Date.now();
          if (sist[r.data] && now - sist[r.data] < 2500) return;
          sist[r.data] = now;
          var ok = leggTil(r.data);
          var ram = $('#ram'); ram.className = ok ? 'ok' : 'nei'; setTimeout(function () { ram.className = ''; }, 600);
        }
      }, 220);
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
      return '<article class="etikett"><div class="et-topp">' + logo + '<span class="caps">Fredheim gard · Eidså</span></div>' +
        '<h3>' + esc(p.namn) + '</h3><p class="et-tekst">' + esc(p.tekst) + '</p>' +
        '<div class="et-midt"><div><p class="et-pris">' + kr(pr) + '</p><p>' + vekt(pk.g) + ' · ' + kr(p.kg) + '/kg</p>' +
        '<p class="et-sm">Pakka ' + dato(PAKKA) + ' · Best før ' + dato(BESTFOR) + '<br>Parti ' + PARTI + ' · Pakke ' + pk.id + '<br>Oppbevarast ved 0–4 °C</p></div>' +
        '<div class="et-qr">' + qrSvg(url(k)) + '<span>Skann for å kjøpe</span></div></div></article>';
    }).join('');
    html += ['egg', 'mjolk'].map(function (pid) {
      var p = PROD[pid];
      return '<article class="etikett hylle"><div class="et-topp">' + logo + '<span class="caps">Hyllekode</span></div>' +
        '<h3>' + esc(p.namn) + '</h3><p class="et-tekst">' + esc(p.tekst) + '</p>' +
        '<div class="et-midt"><div><p class="et-pris">' + kr(p.pris) + '</p><p>Skann éin gong per vare du tek</p></div>' +
        '<div class="et-qr">' + qrSvg(url(hylleKode(pid))) + '<span>Skann for å kjøpe</span></div></div></article>';
    }).join('');
    $('#ark').innerHTML = html;
    $('#doer-qr').innerHTML = qrSvg(base(), 6);
    $('#testliste').innerHTML = PAKKAR.map(function (pk) {
      var p = PROD[pk.p];
      return '<li><button class="btn" data-test="' + esc(lagKode(pk)) + '">' + esc(p.namn) + ' ' + vekt(pk.g) + '<span>' + kr(pris(p, pk.g)) + '</span></button></li>';
    }).join('') + ['egg', 'mjolk'].map(function (pid) {
      return '<li><button class="btn" data-test="' + esc(hylleKode(pid)) + '">' + esc(PROD[pid].namn) + '<span>' + kr(PROD[pid].pris) + '</span></button></li>';
    }).join('');
  }

  // ---------- Ruting ----------
  function ruting() {
    var h = location.hash;
    if (h.indexOf('#v=') === 0) {
      leggTil(h); history.replaceState(null, '', base()); vis('#korg'); return;
    }
    if (h === '#etikettar') vis('#etikettar'); else vis('#korg');
  }
  window.addEventListener('hashchange', ruting);

  lagEtikettar();
  teikn();
  ruting();
})();
