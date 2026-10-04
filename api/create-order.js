export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { name, phone, email, tickets } = req.body || {};
    const count = Number(tickets);
    if (!name || !email || !phone || !Number.isInteger(count) || count < 1 || count > 4) {
      return res.status(400).json({ error: 'Please provide valid registration details.' });
    }
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ error: 'Payment setup is not configured yet. Please add the Razorpay live keys in Vercel.' });
    }
    const amount = count * 1 * 100;
    const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method:'POST',
      headers:{'Authorization':`Basic ${auth}`,'Content-Type':'application/json'},
      body:JSON.stringify({
        amount,
        currency:'INR',
        receipt:`HERHOUR-${Date.now()}`,
        notes:{event:'HER HOUR by TCH',name:String(name).slice(0,100),phone:String(phone).slice(0,30),email:String(email).slice(0,120),tickets:String(count)}
      })
    });
    const data = await response.json();
    if (!response.ok) return res.status(502).json({error:data.error?.description || 'Razorpay could not create the order.'});
    return res.status(200).json({orderId:data.id,amount:data.amount,key:process.env.RAZORPAY_KEY_ID});
  } catch (e) {
    return res.status(500).json({error:'Unable to start payment right now.'});
  }
}
