# Jaguar Rentals landing page

A single page site for Netlify. No build step needed.

## Files
- `index.html` the page
- `logo.png` the Jaguar Rentals logo
- `xtrail-*.jpg` and `cx5-*.jpg` the car photos

## Put it online
1. Create a new GitHub repository (for example `jaguar-rentals`) and upload every file in this folder to it.
2. In Netlify: Add new site → Import an existing project → GitHub → pick the repository.
3. Leave Build command empty and set Publish directory to `/` (the root). Click Deploy.

## Get every request by email
1. In Netlify open the site → Forms → enable form detection, then redeploy once.
2. A form called **rental-request** appears after the first deploy.
3. Forms → Form notifications → Add notification → Email notification → choose rental-request and enter the email you want requests sent to.

Every request is now saved in three places: your WhatsApp (when the renter taps send), the Netlify Forms dashboard, and your email. The request is saved as soon as the renter signs, even if they never tap send on WhatsApp.

## Change prices or photos
- Prices and deposits live near the bottom of `index.html` in the lines starting with `const CARS` and `const DEP`.
- To change a photo, upload a new file with the same name.

## Take payments with Stripe
The page has a **Pay booking deposit** button. It calls `netlify/functions/create-checkout.mjs`, which works out the deposit (30% of the rental, minimum one day's rate) and opens a Stripe Checkout page.

1. Upload the `netlify` folder to GitHub along with everything else. Keep the path exactly `netlify/functions/create-checkout.mjs`.
2. In Stripe: Developers → API keys → copy the **Secret key** (starts with `sk_live_`, or `sk_test_` to test first).
3. In Netlify: Site configuration → Environment variables → Add variable. Key: `STRIPE_SECRET_KEY`, value: the secret key. Then redeploy.
4. Test with a `sk_test_` key and Stripe's test card 4242 4242 4242 4242 (any future date, any CVC). Switch to the live key when it works.

Never put the secret key inside index.html or anywhere in GitHub. It only goes in Netlify's environment variables.

Every payment shows in your Stripe dashboard with the renter's name, phone, car, dates, rental total and deposit. To change prices, update them in **both** `index.html` and `create-checkout.mjs`.
