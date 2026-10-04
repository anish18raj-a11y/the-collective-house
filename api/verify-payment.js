import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      name,
      phone,
      email,
      tickets
    } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
  return res.status(400).json({
    verified: false,
    error: 'Missing payment verification details.',
    received: {
      order_id: !!razorpay_order_id,
      payment_id: !!razorpay_payment_id,
      signature: !!razorpay_signature
    }
  });
}
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        verified: false,
        error: 'Payment verification is not configured.'
      });
    }

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected.length !== razorpay_signature.length) {
      return res.status(400).json({
        verified: false,
        error: 'Payment signature length mismatch.'
      });
    }

    const verified = crypto.timingSafeEqual(
      Buffer.from(expected, 'utf8'),
      Buffer.from(razorpay_signature, 'utf8')
    );

    if (!verified) {
      return res.status(400).json({
        verified: false,
        error: 'Payment signature could not be verified.'
      });
    }

    if (process.env.REGISTRATION_WEBHOOK_URL) {
      try {
        await fetch(process.env.REGISTRATION_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            source: 'tch-website',
            event: 'her_hour_payment_verified',
            name,
            phone,
            email,
            tickets: Number(tickets),
            order_id: razorpay_order_id,
            payment_id: razorpay_payment_id
          })
        });
      } catch (_) {}
    }

    return res.status(200).json({
      verified: true,
      paymentId: razorpay_payment_id
    });

  } catch (e) {
    return res.status(500).json({
      verified: false,
      error: 'Unable to verify payment right now.'
    });
  }
}
