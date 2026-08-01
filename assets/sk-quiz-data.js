/*
 * sk-quiz-data.js — ÉN kilde til sannhet for produktveiviseren.
 * -------------------------------------------------------------
 * Spørsmål, svaralternativer og rutingregler. Tekst kan endres uten å røre
 * logikken i sk-quiz.js. Klassisk script: setter window.SK_QUIZ_DATA.
 *
 * Ruting: reglene evalueres i rekkefølge, FØRSTE treff vinner. Kun q1 (concern)
 * og q2 (area) styrer produktet. Alder og LED-erfaring endrer ALDRI produktet –
 * de gir bare mer tilpasset resultat/segmentering.
 *
 * Alle 12 kombinasjoner (4 bekymringer × 3 områder) er dekket:
 *              ansikt        hals            begge
 *   akne       Clear         Duo             Duo
 *   rynker     Face          Neck            Face+Neck
 *   fasthet    Face          Neck            Face+Neck
 *   hudtone    Face          Neck            Face+Neck
 */
(function () {
  'use strict';

  window.SK_QUIZ_DATA = {
    version: 'sk_quiz_v1',

    /* -------- Steg (rekkefølge = visningsrekkefølge) --------
       type: single (radio). key = nøkkel i svar-objektet.
       routing: true = styrer produktet (q1/q2). false = kun innhold/segment. */
    steps: [
      {
        id: 'q1',
        key: 'concern',
        routing: true,
        legend: 'Hva plager huden din mest akkurat nå?',
        options: [
          { value: 'akne', label: 'Utbrudd og problemhud' },
          { value: 'rynker', label: 'Fine linjer og rynker' },
          { value: 'fasthet', label: 'Mindre fasthet og spenst' },
          { value: 'hudtone', label: 'Ujevn tone og lite glød' }
        ]
      },
      {
        id: 'q2',
        key: 'area',
        routing: true,
        legend: 'Hvor vil du se forskjell?',
        options: [
          { value: 'ansiktet', label: 'Ansiktet' },
          { value: 'hals', label: 'Hals og dekolleté' },
          { value: 'begge', label: 'Både ansikt og hals' }
        ]
      },
      {
        id: 'q3',
        key: 'age',
        routing: false,
        legend: 'Hvilken aldersgruppe er du i?',
        options: [
          { value: 'u30', label: 'Under 30' },
          { value: '30_45', label: '30–45' },
          { value: '45_60', label: '45–60' },
          { value: 'o60', label: 'Over 60' }
        ]
      },
      {
        id: 'q4',
        key: 'led_experience',
        routing: false,
        legend: 'Har du brukt LED-behandling før?',
        options: [
          { value: 'nybegynner', label: 'Nei – helt ny' },
          { value: 'klinikk', label: 'Ja – på klinikk' },
          { value: 'hjemme', label: 'Ja – hjemmeapparat' }
        ]
      }
    ],

    /* -------- Rutingregler (første treff vinner) --------
       Matchtyper (evalueres i sk-quiz.js):
         equals: { key: value }        → alle må stemme (AND)
         inList: { key: [v1, v2] }     → key må være én av verdiene
         anyEquals: [[key,value], ...] → minst én må stemme (OR)
         default: true                 → fanger alt (siste) */
    rules: [
      { id: 'R1', equals: { concern: 'akne', area: 'ansiktet' }, handle: 'skinora-clear' },
      { id: 'R2', equals: { concern: 'akne' }, inList: { area: ['hals', 'begge'] }, handle: 'skinora-duo-clear-radiance-neck' },
      { id: 'R3', inList: { concern: ['rynker', 'fasthet', 'hudtone'] }, equals: { area: 'ansiktet' }, handle: 'skinora-radiance-face' },
      { id: 'R4', inList: { concern: ['rynker', 'fasthet', 'hudtone'] }, equals: { area: 'hals' }, handle: 'skinora-radiance-neck' },
      { id: 'R5', inList: { concern: ['rynker', 'fasthet', 'hudtone'] }, equals: { area: 'begge' }, handle: 'skinora-radiance-face-neck' },
      { id: 'R6', default: true, handle: 'skinora-radiance-face' }
    ],

    /* -------- Produkt-metadata --------
       Kun handle + innhold. INGEN pris her: pris, tittel, bilde og variant-id
       hentes live fra /products/{handle}.js i sk-quiz.js.
         badge           = liten merkelapp øverst i resultatet
         reason          = én selgende setning om HVORFOR dette passer svaret
         clearAssessment = vis lenke til Clear-selvtesten
         protocol        = kort kode til Klaviyo (to protokoller: clear / radiance) */
    products: {
      'skinora-radiance-face': {
        badge: 'Mest populær',
        reason: 'Rødt lys bygger fasthet og glød i ansiktet – vår mest allsidige maske.',
        protocol: 'radiance'
      },
      'skinora-radiance-neck': {
        badge: '',
        reason: 'Målrettet rødt lys for hals og dekolleté – området de fleste glemmer.',
        protocol: 'radiance'
      },
      'skinora-clear': {
        badge: 'For problemhud',
        reason: 'Blått lys roer utbrudd og tette porer – laget for problemhud.',
        clearAssessment: true,
        protocol: 'clear'
      },
      'skinora-radiance-face-neck': {
        badge: 'Best verdi',
        reason: 'Full dekning: ansikt og hals behandles samlet for et helhetlig resultat.',
        protocol: 'radiance'
      },
      'skinora-duo-clear-radiance-neck': {
        badge: 'Komplett',
        reason: 'Blått lys mot utbrudd og rødt lys for halsen – hele rutinen i ett.',
        clearAssessment: true,
        protocol: 'clear'
      }
    }
  };
})();
