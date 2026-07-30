/*
 * sk-quiz-data.js — ÉN kilde til sannhet for produktveiviseren.
 * -------------------------------------------------------------
 * Her ligger spørsmål, svaralternativer og rutingregler. Tekst kan endres
 * uten å røre logikken i sk-quiz.js. Klassisk script: setter window.SK_QUIZ_DATA.
 *
 * MERK: Tekster merket «MIDL:» er midlertidige. Endelige spørsmåls- og
 * resultattekster kommer i et eget prompt.
 *
 * Ruting: reglene evalueres i rekkefølge, FØRSTE treff vinner (se sk-quiz.js).
 * Kun q1 (concern) og q2 (area) styrer produktet. Alder, kjønn, LED-erfaring,
 * frekvens og gave endrer ALDRI produktet — de velger bare innhold i resultatet.
 */
(function () {
  'use strict';

  window.SK_QUIZ_DATA = {
    version: 'sk_quiz_v1',

    /* -------- Steg (rekkefølge = visningsrekkefølge) --------
       type: 'single' = ett valg (radio). key = nøkkel i svar-objektet.
       routing: true  = brukes i rutingen (q1/q2). false = kun innhold. */
    steps: [
      {
        id: 'q1',
        key: 'concern',
        routing: true,
        legend: 'MIDL: Hva ønsker du mest å forbedre?',
        options: [
          { value: 'akne', label: 'MIDL: Akne og utbrudd' },
          { value: 'rynker', label: 'MIDL: Linjer og rynker' },
          { value: 'fasthet', label: 'MIDL: Fasthet og elastisitet' },
          { value: 'hudtone', label: 'MIDL: Ujevn hudtone og glød' },
          { value: 'hals', label: 'MIDL: Hals og dekolleté' }
        ]
      },
      {
        id: 'q2',
        key: 'area',
        routing: true,
        legend: 'MIDL: Hvor vil du behandle?',
        options: [
          { value: 'ansiktet', label: 'MIDL: Bare ansiktet' },
          { value: 'hals', label: 'MIDL: Hals også' },
          { value: 'begge', label: 'MIDL: Begge steder – like mye' }
        ]
      },
      {
        id: 'q3',
        key: 'age',
        routing: false,
        legend: 'MIDL: Hvilken aldersgruppe er du i?',
        options: [
          { value: 'u30', label: 'MIDL: Under 30' },
          { value: '30_45', label: 'MIDL: 30–45' },
          { value: '45_60', label: 'MIDL: 45–60' },
          { value: 'o60', label: 'MIDL: Over 60' }
        ]
      },
      {
        id: 'q4',
        key: 'led_experience',
        routing: false,
        legend: 'MIDL: Har du brukt LED-behandling før?',
        options: [
          { value: 'nybegynner', label: 'MIDL: Nei, helt ny' },
          { value: 'klinikk', label: 'MIDL: Ja, i klinikk' },
          { value: 'hjemme', label: 'MIDL: Ja, hjemmeapparat' }
        ]
      }
    ],

    /* -------- Rutingregler (første treff vinner) --------
       Matchtyper som forstås av evalueringen i sk-quiz.js:
         equals: { key: value }        → alle må stemme (AND)
         inList: { key: [v1, v2] }     → key må være én av verdiene
         anyEquals: [[key,value], ...] → minst én må stemme (OR)
         default: true                 → fanger alt (siste)
    */
    rules: [
      { id: 'R1', equals: { concern: 'akne', area: 'ansiktet' }, handle: 'skinora-clear' },
      { id: 'R2', equals: { concern: 'akne', area: 'hals' }, handle: 'skinora-duo-clear-radiance-neck' },
      { id: 'R3', inList: { concern: ['rynker', 'fasthet', 'hudtone'] }, equals: { area: 'ansiktet' }, handle: 'skinora-radiance-face' },
      { id: 'R4', anyEquals: [['concern', 'hals'], ['area', 'hals']], handle: 'skinora-radiance-neck' },
      { id: 'R5', equals: { area: 'begge' }, handle: 'skinora-radiance-face-neck' },
      { id: 'R6', default: true, handle: 'skinora-radiance-face' }
    ],

    /* -------- Produkt-metadata --------
       Kun handle + valgfrie innholdsnøkler. INGEN pris her: pris, tittel, bilde
       og varant-id hentes live fra /products/{handle}.js i sk-quiz.js, slik at
       ingenting kan bli feil eller utdatert. clearAssessment: true => vis lenke
       til selvtest-siden i resultatet.

       protocol = kort kode som følger med e-postinnmeldingen, slik at Klaviyo
       kan sende en LED-protokoll TILPASSET resultatet. TO protokoller:
         'clear'    = akne / blått lys  (Clear + Duo)
         'radiance' = foryngelse / rødt lys  (Face, Neck, Face+Neck) */
    products: {
      'skinora-radiance-face': { badge: 'MIDL: Mest populær', protocol: 'radiance' },
      'skinora-radiance-neck': { badge: '', protocol: 'radiance' },
      'skinora-clear': { badge: '', clearAssessment: true, protocol: 'clear' },
      'skinora-radiance-face-neck': { badge: 'MIDL: Best verdi', protocol: 'radiance' },
      'skinora-duo-clear-radiance-neck': { badge: 'MIDL: Komplett', clearAssessment: true, protocol: 'clear' }
    }
  };
})();
