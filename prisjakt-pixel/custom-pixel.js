// Prisjakt PJ Pixel for Shopify
const PIXEL_ID = '90f2e12b-8ab3-4894-be20-88fd31b3f6d6';
const API = 'https://api.pj.nu/click-conversion';
const KEY = 'pjpixel_conversion';
const WINDOW_DAYS = 30;
const CLID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}_[A-Za-z0-9]{16}$/i;

// 1. Capture the pjclid on any storefront page view
analytics.subscribe('page_viewed', async (event) => {
  const search = event.context?.document?.location?.search || '';
  const clickId = new URLSearchParams(search).get('pjclid');
  if (!clickId || !CLID.test(clickId)) return;

  const expires = new Date(Date.now() + WINDOW_DAYS * 864e5).toUTCString();
  await browser.localStorage.setItem(KEY, `clickId=${clickId};pixelId=${PIXEL_ID};expires=${expires}`);
});

// 2. Report the conversion when the checkout completes
analytics.subscribe('checkout_completed', async (event) => {
  const checkout = event.data?.checkout;
  if (!checkout) return;

  const stored = parseStored(await browser.localStorage.getItem(KEY));
  const attribute = (checkout.attributes || []).find((a) => a.key === 'pjclid')?.value;
  const clickId = stored?.clickId || (CLID.test(attribute || '') ? attribute : null);
  if (!clickId) return; // no Prisjakt click, or the conversion window has expired

  await fetch(`${API}/pixels/${stored?.pixelId || PIXEL_ID}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({
      event_name: 'purchase',
      event_time: new Date().toISOString(),
      external_event_id: String(checkout.order?.id ?? checkout.token),
      signed_click_id: clickId,
      data: {
        amount: Number(checkout.totalPrice?.amount),
        currency: checkout.totalPrice?.currencyCode,
        number_of_items: (checkout.lineItems || []).reduce((n, li) => n + (li.quantity || 0), 0),
      },
    }),
  });
});

function parseStored(raw) {
  if (!raw) return null;
  const map = Object.fromEntries(
    raw
      .split(';')
      .filter(Boolean)
      .map((part) => {
        const i = part.indexOf('=');
        return [part.slice(0, i), part.slice(i + 1)];
      }),
  );
  if (!map.clickId || !CLID.test(map.clickId)) return null;
  if (new Date(map.expires) < new Date()) return null;
  return { clickId: map.clickId, pixelId: map.pixelId };
}
