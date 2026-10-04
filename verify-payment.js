import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, name, phone, email, tickets } = req.body || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return res.status(400).json({error:'Missing payment verification details.'});
    if (!process.env.RAZORPAY_KEY_SECRET) return res.status(500).json({error:'Payment verification is not configured.'});
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
    const verified = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));
    if (!verified) return res.status(400).json({verified:false,error:'Payment signature could not be verified.'});

    // Optional bridge to the existing Google Apps Script registration sheet.
    // Set REGISTRATION_WEBHOOK_URL in Vercel to enable it; never expose this URL in client code.
    if (process.env.REGISTRATION_WEBHOOK_URL) {
      try {
        await fetch(process.env.REGISTRATION_WEBHOOK_URL, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({
            source:'tch-website', event:'her_hour_payment_verified',
            name, phone, email, tickets:Number(tickets),
            order_id:razorpay_order_id, payment_id:razorpay_payment_id
          })
        });
      } catch (_) { /* Payment remains verified even if sheet sync is temporarily unavailable. */ }
    }
    return res.status(200).json({verified:true,paymentId:razorpay_payment_id});
  } catch (e) {
    return res.status(500).json({verified:false,error:'Unable to verify payment right now.'});
  }
}
