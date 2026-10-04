# The Collective House — HER HOUR website checkout

This version replaces the Google Form button for HER HOUR with an on-site ticket checkout using Razorpay Checkout.

## Vercel environment variables
Add these in the Vercel project settings (Production, and Preview if you want to test there):

- `RAZORPAY_KEY_ID` — Razorpay **Live** Key ID
- `RAZORPAY_KEY_SECRET` — Razorpay **Live** Key Secret (server-side only)
- `REGISTRATION_WEBHOOK_URL` — optional URL for syncing verified purchases to the existing Google Apps Script/Sheet flow

Never put `RAZORPAY_KEY_SECRET` into `index.html` or any browser-side JavaScript.

## Flow
1. Guest chooses 1–4 tickets.
2. Guest enters name, WhatsApp and email.
3. `/api/create-order` creates an exact Razorpay order server-side.
4. Razorpay Checkout handles UPI/cards/netbanking.
5. `/api/verify-payment` verifies the Razorpay signature server-side.
6. The site shows a confirmation screen.
7. If `REGISTRATION_WEBHOOK_URL` is configured, the verified purchase is also sent to the existing registration system.

The Google Form link is intentionally no longer the main HER HOUR booking action.
