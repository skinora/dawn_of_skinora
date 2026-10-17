# Prisjakt PJ Pixel (konverteringssporing)

Pixel-ID: `90f2e12b-8ab3-4894-be20-88fd31b3f6d6`

Dokumentasjon: https://developer.prisjakt.nu/docs/sections/for-shops/analytics/pj-pixel/onboarding-shopify

**Ikke** legg `pjpixel.min.js` i temaet. Det virker ikke på Shopify. Pikselen under settes inn som Custom Pixel i Shopify-admin, ikke i temaet.

## Hva som ligger i repoet

- `prisjakt-pixel/custom-pixel.js`: Prisjakts kode for Shopify Custom Pixel, med `PIXEL_ID` satt. Limes inn manuelt (se under).

## Manuelt i Shopify-admin

1. Gå til **Innstillinger → Kundehendelser → Legg til egendefinert piksel**.
2. Gi den navnet **Prisjakt PJ Pixel** og trykk **Legg til piksel**.
3. Sett **Tillatelse = Markedsføring**.
4. Sett **Datasalg = «Data collected doesn't qualify as data sale»**.
5. Lim inn hele innholdet i `prisjakt-pixel/custom-pixel.js` i kodefeltet.
6. Trykk **Lagre**, og deretter **Koble til**. En piksel som er lagret, men ikke koblet til, kjører ikke.

## Test

Pikselen rapporterer et ekte kjøp, så testen krever et ekte klikk fra Prisjakt og en ekte bestilling. Bestillingen teller i tallene dine, så legg den inn slik at du kan kjenne den igjen etterpå.

1. Klikk på ditt eget tilbud på Prisjakt. Sjekk at URL-en på butikken inneholder `pjclid`. Mangler den, er Prisjakt Click ID ikke aktivert i Business Center under Integrations → Conversion Tracking.
2. Åpne nettleserens utviklerverktøy på butikken, gå til Application → Local Storage for butikkens domene, og sjekk at `pjpixel_conversion` finnes med `clickId`, `pixelId` og `expires`.
3. Legg inn en ekte bestilling. På takkesiden: se etter en POST til `api.pj.nu` i Network-fanen.
4. Bekreft i Prisjakt Business Center under **Klikk og kostnad → Konverteringer**. `external_event_id` er Shopify-ordre-ID-en, så testbestillingen er lett å finne.

## Kassedomene

Kassen kjører på `skinora.no`, samme domene som butikken. Da leser pikselen klikk-ID-en direkte fra nettleserens lagring, og reserveskriptet (pjclid som cart-attributt) trengs ikke. Det er derfor ikke lagt inn i temaet. Hvis kassen senere flyttes til et annet domene, må reserveskriptet fra Prisjakts dokumentasjon legges i `layout/theme.liquid` rett før `</head>`.
