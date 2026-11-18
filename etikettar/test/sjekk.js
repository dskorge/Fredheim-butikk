// Kontroll: alle varer på etikettstasjonen må finnast i PROD i src/app.js, elles seier kassa «Kjenner ikkje att denne koden».
// Køyr: node etikettar/test/sjekk.js
const fs = require('fs'), path = require('path');
const rot = path.join(__dirname, '..', '..');
const app = fs.readFileSync(path.join(rot, 'src', 'app.js'), 'utf8');
const prod = app.slice(app.indexOf('var PROD = {'), app.indexOf('};', app.indexOf('var PROD = {')));
const nyklar = new Set([...prod.matchAll(/^\s*(\w+)\s*:\s*\{/gm)].map(m => m[1]));
global.window = {}; eval(fs.readFileSync(path.join(__dirname, '..', 'produkt.js'), 'utf8'));
const P = global.window.FH_PRODUKT;
const vil = [...P.kjot, ...P.kasse, P.mjolk].map(p => p.id);
const manglar = vil.filter(id => !nyklar.has(id));
if (manglar.length) { console.error('Manglar i PROD (src/app.js):', manglar.join(', ')); process.exit(1); }
console.log('OK:', vil.length, 'varer finst i PROD');
