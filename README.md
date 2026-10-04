# The Collective House — Final Website

Final approved TCH website with HER HOUR booking flow.

## Vercel
- `index.html` and `her-hour.html` are static pages.
- Razorpay backend functions are in `/api/create-order.js` and `/api/verify-payment.js`.
- Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` as Vercel Environment Variables before enabling live payments.
- Never put the Razorpay secret in frontend code.
