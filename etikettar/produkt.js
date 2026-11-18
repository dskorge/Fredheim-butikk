// Varer etikettstasjonen kan skrive ut. Nøklane MÅ finnast i PROD i src/app.js
// (test/sjekk.js kontrollerer det). Kilopris for stykningsdelar blir sett på stasjonen.
window.FH_PRODUKT = {
  kjot: [
    { id: 'morbrad', namn: 'Mørbrad' },
    { id: 'ytrefilet', namn: 'Ytrefilet' },
    { id: 'entrecote', namn: 'Entrecôte' },
    { id: 'flatbiff', namn: 'Flatbiff' },
    { id: 'rundstek', namn: 'Rundstek' },
    { id: 'hogrygg', namn: 'Høgrygg' },
    { id: 'bogstek', namn: 'Bogstek' },
    { id: 'grytekjot', namn: 'Grytekjøt' },
    { id: 'suppekjot', namn: 'Suppekjøt' },
    { id: 'deig', namn: 'Kjøtdeig', kverna: true, kg: 219 },
    { id: 'karbonade', namn: 'Karbonadedeig', kverna: true }
  ],
  kasse: [
    { id: 'familie', namn: 'Familiekasse', pris: 2890, tekst: 'ca. 10 kg blanda stykningsdelar' },
    { id: 'halv', namn: 'Halv kasse', pris: 1490, tekst: 'Halv familiekasse' },
    { id: 'deigpakke', namn: 'Kjøtdeigpakke', pris: 1090, tekst: '5 kg kjøtdeig', kverna: true },
    { id: 'helg', namn: 'Helgepakke', pris: 990, tekst: 'ca. 2 kg · biff, entrecôte, ytrefilet' }
  ],
  mjolk: { id: 'mjolk', namn: 'Heilmelk', pris: 45, dagar: 7 }
};
