// Creates a Stripe Checkout payment for the booking deposit.
// Prices are recalculated here so nobody can change the amount in their browser.
// Requires the STRIPE_SECRET_KEY environment variable in Netlify.
const CARS = {
  xtrail: { name: '2018 Nissan X-Trail', usd: { d: 46, w: 243, m: 755, l: 674 }, mxn: { d: 850, w: 4500, m: 14000, l: 12500 } },
  cx5: { name: '2021 Mazda CX-5 Grand Touring', usd: { d: 51, w: 280, m: 836, l: 728 }, mxn: { d: 950, w: 5200, m: 15500, l: 13500 } }
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return json({ error: 'Online payment is not set up yet. Please message us on WhatsApp.' }, 500);

  let b;
  try { b = await req.json(); } catch { return json({ error: 'Bad request' }, 400); }

  const car = CARS[b.car];
  const cur = b.cur === 'mxn' ? 'mxn' : 'usd';
  const from = new Date(b.from + 'T12:00:00Z');
  const to = new Date(b.to + 'T12:00:00Z');
  const d = Math.round((to - from) / 864e5);
  if (!car || !(d > 0) || d > 366) return json({ error: 'Please check your vehicle and dates.' }, 400);

  const r = car[cur];
  let total, plan;
  if (d >= 90) { total = Math.round(r.l * d / 30); plan = 'Long term rate'; }
  else if (d >= 30) { total = Math.round(r.m * d / 30); plan = 'Monthly rate'; }
  else if (d >= 7) { total = Math.min(Math.round(r.w * d / 7), r.m); plan = 'Weekly rate'; }
  else { total = Math.min(r.d * d, r.w); plan = 'Daily rate'; }
  const deposit = Math.max(Math.round(total * 0.3), r.d);
  const C = cur.toUpperCase();
  const clean = (v) => String(v || '').slice(0, 200);

  const origin = new URL(req.url).origin;
  const p = new URLSearchParams();
  p.set('mode', 'payment');
  p.set('success_url', origin + '/?paid=1#book');
  p.set('cancel_url', origin + '/?paid=0#book');
  if (b.email) p.set('customer_email', clean(b.email));
  p.set('line_items[0][quantity]', '1');
  p.set('line_items[0][price_data][currency]', cur);
  p.set('line_items[0][price_data][unit_amount]', String(deposit * 100));
  p.set('line_items[0][price_data][product_data][name]', `Booking deposit: ${car.name}`);
  p.set('line_items[0][price_data][product_data][description]',
    `${b.from} to ${b.to} (${d} days, ${plan.toLowerCase()}). Applied to your rental total of ${total} ${C}. Nonrefundable if you cancel.`);
  const meta = { renter: clean(b.name), phone: clean(b.phone), vehicle: car.name, pickup: b.from, return: b.to, days: String(d), rental_total: `${total} ${C}`, deposit: `${deposit} ${C}` };
  for (const [k, v] of Object.entries(meta)) {
    p.set(`metadata[${k}]`, v);
    p.set(`payment_intent_data[metadata][${k}]`, v);
  }
  p.set('payment_intent_data[description]', `Jaguar Rentals deposit: ${clean(b.name)}, ${car.name}, ${b.from} to ${b.to}`);

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: p
  });
  const s = await res.json();
  if (!res.ok) return json({ error: 'Could not start the payment. Please message us on WhatsApp.' }, 502);
  return json({ url: s.url });
};

export const config = { path: '/api/checkout' };
